#!/usr/bin/env python3
"""Run hosted v3 tagging via the deployed Netlify endpoints."""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from http.cookiejar import CookieJar
from typing import Any, Dict, Iterable, List, Optional
from urllib.error import HTTPError
from urllib.parse import urlencode, urljoin
from urllib.request import HTTPCookieProcessor, Request, build_opener


SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

ZENDESK_DELETED_SENTINEL = json.dumps({"_status": "zendesk_deleted"})

TABLES = {"done": "ticket_tags_done", "active": "ticket_tags_active"}


def is_zendesk_deleted(row: Dict[str, Any]) -> bool:
    """Return True if the row is already marked as deleted in Zendesk."""
    raw = row.get("serviceTags") or ""
    try:
        parsed = json.loads(raw) if isinstance(raw, str) else raw
        return isinstance(parsed, dict) and parsed.get("_status") == "zendesk_deleted"
    except (json.JSONDecodeError, TypeError):
        return False


def mark_zendesk_deleted(dataset: str, ticket_id: int) -> None:
    """Write the zendesk_deleted sentinel to Supabase for a dead ticket."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        return
    table = TABLES.get(dataset, TABLES["done"])
    url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/{table}?Ticket%20ID=eq.{ticket_id}"
    body = json.dumps({
        "service_tags_json": ZENDESK_DELETED_SENTINEL,
        "product_tags_json": ZENDESK_DELETED_SENTINEL,
    }).encode("utf-8")
    req = Request(url, data=body, method="PATCH")
    req.add_header("apikey", SUPABASE_SERVICE_ROLE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_SERVICE_ROLE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=minimal")
    try:
        from urllib.request import urlopen
        urlopen(req)
    except Exception:
        pass  # best-effort


def is_record_not_found(error: Exception) -> bool:
    """Check if the error is a Zendesk RecordNotFound 404."""
    return "RecordNotFound" in str(error)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Trigger hosted v3 tagging via Netlify endpoints.")
    parser.add_argument("--base-url", default=os.getenv("FINIDASH_BASE_URL", ""), help="Base URL (e.g. https://finidash-preview.netlify.app)")
    parser.add_argument("--password", default=os.getenv("FINIDASH_APP_PASSWORD", ""), help="App password for /login (env FINIDASH_APP_PASSWORD)")
    parser.add_argument("--dataset", default="done", choices=["done", "active"], help="Dataset to update (done|active).")
    parser.add_argument("--subdomain", default="", help="Optional Zendesk subdomain override.")
    parser.add_argument("--start", type=int, default=1, help="1-based start index in the tagged rows list.")
    parser.add_argument("--count", type=int, default=0, help="How many tickets to tag (0 = all remaining).")
    parser.add_argument("--timeout", type=int, default=120, help="Per-ticket timeout in seconds.")
    parser.add_argument("--interval", type=float, default=3.0, help="Poll interval in seconds.")
    parser.add_argument("--no-wait", action="store_true", help="Do not wait for job completion.")
    return parser.parse_args()


def normalize_base_url(base_url: str) -> str:
    trimmed = base_url.strip().rstrip("/")
    if not trimmed:
        raise SystemExit("Provide --base-url or set FINIDASH_BASE_URL.")
    if not trimmed.startswith("http"):
        trimmed = f"https://{trimmed}"
    return trimmed


def login(base_url: str, password: str):
    if not password:
        raise SystemExit("Provide --password or set FINIDASH_APP_PASSWORD.")
    jar = CookieJar()
    opener = build_opener(HTTPCookieProcessor(jar))
    body = urlencode({"password": password, "redirectTo": "/zincwork-tagging"}).encode("utf-8")
    req = Request(urljoin(base_url, "/.netlify/functions/login"), data=body, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    opener.open(req)
    if not any(cookie.name == "auth_session" for cookie in jar):
        raise RuntimeError("Login failed: auth_session cookie not set.")
    return opener


def request_json(opener, url: str, method: str = "GET", payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    data = None
    headers: Dict[str, str] = {}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = Request(url, data=data, method=method, headers=headers)
    try:
        with opener.open(req) as resp:
            raw = resp.read()
    except HTTPError as exc:
        raw = exc.read()
        message = raw.decode("utf-8", errors="ignore")
        raise RuntimeError(f"{method} {url} failed ({exc.code}): {message}") from exc
    if not raw:
        return {}
    return json.loads(raw.decode("utf-8"))


def fetch_rows(opener, base_url: str, dataset: str) -> List[Dict[str, Any]]:
    url = urljoin(base_url, f"/api/zincwork/tagged-rows?dataset={dataset}")
    data = request_json(opener, url)
    rows = data.get("rows", [])
    if not isinstance(rows, list):
        return []
    return sorted([row for row in rows if isinstance(row, dict)], key=lambda r: r.get("ticketId", 0))


def select_rows(rows: List[Dict[str, Any]], start: int, count: int) -> List[Dict[str, Any]]:
    if start < 1:
        raise SystemExit("--start must be >= 1.")
    start_idx = start - 1
    end_idx = None if count <= 0 else start_idx + count
    return rows[start_idx:end_idx]


def prepare_ticket(opener, base_url: str, ticket_id: int, subdomain: str) -> Dict[str, Any]:
    payload: Dict[str, Any] = {"action": "prepare", "ticketId": ticket_id}
    if subdomain:
        payload["subdomain"] = subdomain
    url = urljoin(base_url, "/api/zendesk/tag-ticket-v3")
    data = request_json(opener, url, method="POST", payload=payload)
    if data.get("ok") is False:
        raise RuntimeError(data.get("error") or "Prepare failed.")
    return data


def start_background(opener, base_url: str, dataset: str, ticket_id: int, transcript: List[Dict[str, Any]], overrides: Dict[str, Any]) -> Dict[str, Any]:
    url = urljoin(base_url, "/.netlify/functions/tag-ticket-v3-background")
    payload = {
        "dataset": dataset,
        "ticketId": ticket_id,
        "transcript": transcript,
        "overrides": overrides,
    }
    return request_json(opener, url, method="POST", payload=payload)


def poll_until_updated(
    opener,
    base_url: str,
    dataset: str,
    ticket_id: int,
    previous_last_updated: Optional[str],
    timeout: int,
    interval: float,
) -> Dict[str, Any]:
    start = time.time()
    while time.time() - start < timeout:
        status = request_json(
            opener,
            urljoin(base_url, f"/api/zincwork/tag-status?dataset={dataset}&ticketId={ticket_id}"),
        )
        job = status.get("job") or {}
        if job.get("status") == "failed":
            raise RuntimeError(job.get("error_message") or "Tagging job failed.")

        row = request_json(
            opener,
            urljoin(base_url, f"/api/zincwork/tagged-row?dataset={dataset}&ticketId={ticket_id}"),
        )
        if row.get("ok") and row.get("row"):
            last_updated = row["row"].get("lastUpdated")
            if last_updated and last_updated != previous_last_updated:
                return row["row"]

        time.sleep(interval)
    raise RuntimeError("Timed out waiting for tagging to complete.")


def main() -> None:
    args = parse_args()
    base_url = normalize_base_url(args.base_url)
    opener = login(base_url, args.password)

    rows = fetch_rows(opener, base_url, args.dataset)
    if not rows:
        raise SystemExit("No rows returned from hosted API.")

    selected = select_rows(rows, args.start, args.count)
    if not selected:
        raise SystemExit("No tickets selected (check --start/--count).")

    print(f"Selected {len(selected)} tickets starting at row {args.start}.")
    succeeded: List[int] = []
    skipped: List[int] = []
    failed: List[Dict[str, Any]] = []
    for idx, row in enumerate(selected, start=1):
        ticket_id = int(row.get("ticketId", 0))
        if ticket_id <= 0:
            continue
        if is_zendesk_deleted(row):
            print(f"[{idx}/{len(selected)}] Skipping ticket {ticket_id} (zendesk_deleted)")
            skipped.append(ticket_id)
            continue
        print(f"[{idx}/{len(selected)}] Tagging ticket {ticket_id}...")
        try:
            prep = prepare_ticket(opener, base_url, ticket_id, args.subdomain)
            transcript = prep.get("transcript") or []
            overrides = prep.get("overrides") or {}

            bg = start_background(opener, base_url, args.dataset, ticket_id, transcript, overrides)
            job_id = bg.get("jobId")
            if job_id:
                print(f"  Started job {job_id}")

            if args.no_wait:
                succeeded.append(ticket_id)
                continue

            updated = poll_until_updated(
                opener,
                base_url,
                args.dataset,
                ticket_id,
                row.get("lastUpdated"),
                args.timeout,
                args.interval,
            )
            print(f"  Done. lastUpdated={updated.get('lastUpdated')}")
            succeeded.append(ticket_id)
        except Exception as exc:
            print(f"  FAILED: {exc}")
            if is_record_not_found(exc):
                print(f"  Marking ticket {ticket_id} as zendesk_deleted in Supabase")
                mark_zendesk_deleted(args.dataset, ticket_id)
            failed.append({"ticketId": ticket_id, "error": str(exc)})

    print(f"\n=== SUMMARY ===")
    print(f"Succeeded: {len(succeeded)}")
    print(f"Skipped (deleted): {len(skipped)}")
    print(f"Failed:    {len(failed)}")
    if failed:
        print("Failed tickets:")
        for f in failed:
            print(f"  {f['ticketId']}: {f['error']}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # pragma: no cover
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)
