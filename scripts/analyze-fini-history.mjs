#!/usr/bin/env node
/*
  Fetch ~200 Fini conversations before a specified end date (defaults to end of previous month),
  extract user questions from botRequests, and write 15 sample questions to src/data/questions.md.

  Usage examples:
    FINI_API_KEY=... node scripts/analyze-fini-history.mjs
    FINI_API_KEY=... node scripts/analyze-fini-history.mjs --start 2025-01-01 --end 2025-09-30 --limit 50 --pages 10

  Notes:
  - Requires FINI_API_KEY (or NEXT_PUBLIC_FINI_API_KEY) to be set in your environment.
  - Only writes the final 15 questions (no raw transcripts saved).
*/

const API_ENDPOINT = "https://api-prod.usefini.com/v2/bots/requests/public";
const DEFAULT_KEY = process.env.FINI_API_KEY ?? process.env.NEXT_PUBLIC_FINI_API_KEY ?? "";

const fs = await import("node:fs/promises");
const path = await import("node:path");

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--start") out.start = argv[++i];
    else if (a === "--end") out.end = argv[++i];
    else if (a === "--limit") out.limit = Number(argv[++i]);
    else if (a === "--pages") out.pages = Number(argv[++i]);
    else if (a === "--source") out.source = argv[++i];
    else if (a === "--escalation") out.escalation = argv[++i]; // "true" | "false"
  }
  return out;
}

function endOfPreviousMonthUtc(now = new Date()) {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth(); // 0-11
  // previous month: if m=0 (Jan), then Dec of previous year
  const end = new Date(Date.UTC(m === 0 ? y - 1 : y, m === 0 ? 12 : m, 0, 23, 59, 59, 999));
  return end;
}

function toStartOfDayEpoch(dateStr) {
  if (!dateStr) return undefined;
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  const t = d.getTime();
  return Number.isFinite(t) ? t : undefined;
}

function toEndOfDayEpoch(dateStr) {
  if (!dateStr) return undefined;
  const d = new Date(`${dateStr}T23:59:59.999Z`);
  const t = d.getTime();
  return Number.isFinite(t) ? t : undefined;
}

function prevMonthEndEpoch() {
  const end = endOfPreviousMonthUtc();
  return end.getTime();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchPage({ key, limit, cursor, startEpoch, endEpoch, source, escalation }, attempt = 0) {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (cursor) params.set("cursor", cursor);
  if (typeof startEpoch === "number") params.set("startEpoch", String(startEpoch));
  if (typeof endEpoch === "number") params.set("endEpoch", String(endEpoch));
  if (source) params.set("source", source);
  if (escalation === "true" || escalation === "false") params.set("escalation", escalation);

  const url = `${API_ENDPOINT}?${params.toString()}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    if (res.status === 429 && attempt < 5) {
      const retryAfter = Number(res.headers.get("retry-after"));
      const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1500 * (attempt + 1);
      await sleep(delay);
      return fetchPage({ key, limit, cursor, startEpoch, endEpoch, source, escalation }, attempt + 1);
    }
    const body = await res.text();
    throw new Error(body || `Request failed: ${res.status}`);
  }
  return res.json();
}

function extractQuestions(conversations) {
  const items = [];
  for (const conv of conversations || []) {
    if (!Array.isArray(conv.botRequests)) continue;
    for (const req of conv.botRequests) {
      const q = typeof req?.question === "string" ? req.question : "";
      if (!q) continue;
      items.push(q);
    }
  }
  return items;
}

function pickCandidateSentences(text) {
  // split on question marks first; then on newlines; take shortish pieces
  const parts = String(text)
    .replace(/\r/g, "\n")
    .split(/[?\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts;
}

function looksQuestionLike(s) {
  const lower = s.toLowerCase();
  if (lower.length < 6) return false;
  if (lower.length > 220) return false;
  const starters = [
    "how ",
    "what ",
    "can ",
    "why ",
    "where ",
    "when ",
    "is ",
    "does ",
    "do ",
    "should ",
    "will ",
    "could ",
    "unable ",
    "i can't ",
    "i cannot ",
    "can't ",
    "cannot ",
    "error ",
  ];
  if (starters.some((p) => lower.startsWith(p))) return true;
  return /\b(how|what|why|where|when|can|does|do|should|will|could)\b/.test(lower);
}

function toQuestionForm(s) {
  let t = s.replace(/\s+/g, " ").trim();
  if (t.length > 220) t = t.slice(0, 217) + "…";
  if (!/[?]$/.test(t)) t = t + "?";
  return t;
}

function normalizeQuestion(q) {
  return q
    .toLowerCase()
    .replace(/[\u2018\u2019\u201C\u201D]/g, "\"")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickTopQuestions(allQuestions, count = 15) {
  // expand to candidate sentences, filter to look like questions, then rank by frequency
  const candidates = [];
  for (const raw of allQuestions) {
    const parts = pickCandidateSentences(raw);
    for (const p of parts) {
      if (looksQuestionLike(p)) candidates.push(toQuestionForm(p));
    }
  }
  const freq = new Map();
  const exemplar = new Map();
  for (const q of candidates) {
    const norm = normalizeQuestion(q);
    if (!norm) continue;
    freq.set(norm, (freq.get(norm) || 0) + 1);
    if (!exemplar.has(norm)) exemplar.set(norm, q);
  }
  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
  const ordered = sorted.map(([norm]) => exemplar.get(norm));
  const seen = new Set();
  const final = [];
  for (const q of ordered) {
    const n = normalizeQuestion(q);
    if (!seen.has(n)) {
      seen.add(n);
      final.push(q);
    }
    if (final.length >= count) break;
  }
  // If still short, add any remaining cleaned sentences lightly
  if (final.length < count) {
    for (const raw of allQuestions) {
      const t = toQuestionForm(raw.split(/\n+/)[0] || raw);
      const n = normalizeQuestion(t);
      if (!seen.has(n)) {
        seen.add(n);
        final.push(t);
      }
      if (final.length >= count) break;
    }
  }
  return final.slice(0, count);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const key = process.env.FINI_API_KEY || process.env.NEXT_PUBLIC_FINI_API_KEY || DEFAULT_KEY;
  if (!key) {
    throw new Error("FINI_API_KEY is required (no default key available)");
  }

  const limit = Number.isFinite(args.limit) && args.limit > 0 && args.limit <= 50 ? args.limit : 50;
  const target = 200; // hard target for this task
  const maxPages = Number.isFinite(args.pages) && args.pages > 0 ? args.pages : 20; // up to ~1000 if needed

  const endEpoch = args.end ? toEndOfDayEpoch(args.end) : prevMonthEndEpoch();
  const startEpoch = args.start ? toStartOfDayEpoch(args.start) : undefined; // optional; widen if needed

  let cursor = undefined;
  let allQuestions = [];
  let conversationCount = 0;
  let effectiveEndEpoch = endEpoch; // may move backward if no cursor-based pagination
  let earliestSeen = Number.POSITIVE_INFINITY;

  for (let page = 0; page < maxPages; page++) {
    const data = await fetchPage({
      key,
      limit,
      cursor,
      startEpoch,
      endEpoch: effectiveEndEpoch,
      source: args.source,
      escalation: args.escalation,
    });

    const conversations = Array.isArray(data?.conversations) ? data.conversations : [];
    conversationCount += conversations.length;
    allQuestions = allQuestions.concat(extractQuestions(conversations));
    for (const c of conversations) {
      const ts = typeof c?.createdAt === "number" ? c.createdAt : Number.POSITIVE_INFINITY;
      if (ts < earliestSeen) earliestSeen = ts;
    }
    if (conversationCount >= target) break;

    if (data?.hasMore && data?.cursor) {
      cursor = data.cursor;
      continue;
    }

    // No cursor or no more pages via cursor: roll the window back if we still need more.
    if (conversationCount < target && Number.isFinite(earliestSeen)) {
      effectiveEndEpoch = earliestSeen - 1; // step back before the earliest seen item
      cursor = undefined; // reset for the new window
      continue;
    }
    break;
  }

  if (conversationCount < 200) {
    console.warn(
      `Warning: fetched ${conversationCount} conversations (< 200). Consider widening the date range with --start.`,
    );
  }

  const picked = pickTopQuestions(allQuestions, 15);

  const outLines = [
    "# Frequently Asked Questions (Derived from Fini history)",
    `- Conversations inspected: ${conversationCount}`,
    args.end ? `- End date: ${args.end}` : `- End date: end of previous month`,
    args.start ? `- Start date: ${args.start}` : `- Start date: (not set)`,
    "",
    "## 15 Questions",
    ...picked.map((q, i) => `${i + 1}. ${q}`),
    "",
    "> Generated by scripts/analyze-fini-history.mjs",
  ];

  const outPath = path.join(process.cwd(), "src", "data", "questions.md");
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, outLines.join("\n"), "utf8");

  console.log(`Wrote 15 questions to ${outPath}`);
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
