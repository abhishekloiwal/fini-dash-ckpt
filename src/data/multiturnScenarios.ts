export type MultiTurnScenario = {
  id: string;
  personaName: string;
  personaSummary: string;
  primaryObjective: string;
  tone: string;
  sentiment: string;
  scenarioSeed: string;
  initialUserMessage: string;
  focusCategory: string;
  sourceNotes: string;
};

export const multiTurnScenarios: MultiTurnScenario[] = [
  {
    id: "connection-apiture-migration",
    personaName: "Christian Bennett",
    personaSummary:
      "Implementation specialist at Pilgrim Bank coordinating a post-migration handoff with Monarch’s support team.",
    primaryObjective:
      "Update the Monarch Money connector to point at the bank’s new Apiture login so shared customers can sign in again.",
    tone: "Professional, collaborative, time-sensitive",
    sentiment: "Concerned but solution-oriented",
    scenarioSeed:
      "Pilgrim Bank completed a conversion from Shazam to Apiture this week. Their mutual customer can no longer connect in Monarch because the login URL still points to the legacy site. Christian reaches out with the new link, wants confirmation that Monarch updated it, and needs guidance on interim steps for the affected customer.",
    initialUserMessage:
      "Hi team—Pilgrim Bank just flipped to Apiture and our customer can’t log in through Monarch anymore. The login still points at the old Shazam URL. Can you switch it to https://banking.apiture.com/DigitalBanking/fx?iid=PBPTX2 or let me know what to tell them until it’s fixed?",
    focusCategory: "Connection Issue",
    sourceNotes:
      "Drawn from multiple Zendesk tickets where institution partners (Apiture, Pilgrim Bank) asked Monarch to refresh the login endpoint after a platform migration (Sep 2025).",
  },
  {
    id: "missing-direct-deposits",
    personaName: "Chloe Martinez",
    personaSummary:
      "Busy household CFO juggling multiple accounts; monitors ACH deposits closely after a previous sync issue.",
    primaryObjective:
      "Restore missing Fidelity Visa Signature transactions from 9/21–9/25 and confirm future direct deposits will sync automatically.",
    tone: "Frustrated yet appreciative when helped",
    sentiment: "Annoyed by repeated sync gaps",
    scenarioSeed:
      "Chloe’s Monarch account shows all credit card swipes, but the ACH / direct deposit activity from her cash management account disappeared again. She manually added a few entries last week after support instructions. Now a cluster of purchases (Shell, Zappos, Trader Joe’s) from 9/21-9/25 is still missing. She wants a durable fix—not another manual import.",
    initialUserMessage:
      "Morning! My Fidelity Visa Sig transactions from 9/21-9/25 are still gone—even though ACH stuff finally showed up. Shell, Zappos, Trader Joe’s… all missing. I don’t want to keep hand-entering them. Is there a real fix for this?",
    focusCategory: "Transactions",
    sourceNotes:
      "Inspired by September 2025 tickets about Fidelity Visa Signature rewards card missing recent transactions after ACH reconnects.",
  },
  {
    id: "referral-credit-missing",
    personaName: "Andrew Lee",
    personaSummary:
      "Long-time Monarch evangelist who invites friends; tracks referral perks to offset his subscription cost.",
    primaryObjective:
      "Verify a newly referred friend’s paid subscription triggered the referral reward and, if not, escalate for manual credit.",
    tone: "Friendly but persistent",
    sentiment: "Hopeful yet worried reward slipped through",
    scenarioSeed:
      "Andrew referred a friend yesterday. The friend confirmed activating a paid plan, but the referral dashboard tile still shows zero rewards. Andrew wants to know if there’s a delay, whether the referral email worked, and what proof he should share so Monarch can apply the credit.",
    initialUserMessage:
      "Hey there, my buddy just paid for Monarch yesterday using my invite but my referral tile still says zero. Does it take a while to show up or do you need something from me so I actually get the reward?",
    focusCategory: "Connect with Team",
    sourceNotes:
      "Based on late-September 2025 conversations where users reported missing referral credits after their friends subscribed.",
  },
  {
    id: "promo-code-not-applied",
    personaName: "Nick Neubaum",
    personaSummary:
      "Small business owner who signed up during a promotional offer and closely audits subscription charges.",
    primaryObjective:
      "Confirm the ROB50 promo was applied to his first annual charge or receive a corrected invoice/refund.",
    tone: "Direct, businesslike, expects quick resolution",
    sentiment: "Dissatisfied and skeptical",
    scenarioSeed:
      "Nick activated Monarch with the ROB50 code but sees a $99.99 charge on his statement. He screenshots the Billing page (no Manage Subscription link) and requests immediate confirmation the discount applied—or a refund timeline if not.",
    initialUserMessage:
      "Hi—signed up with ROB50 but my card still got hit for the full $99.99. I don’t even see a Manage Subscription button to double-check it. Can someone confirm the promo stuck or refund the difference?",
    focusCategory: "Billing",
    sourceNotes:
      "Mirrors September 2025 Zendesk threads where subscribers couldn’t verify promotional pricing after trial conversion.",
  },
  {
    id: "filtered-export-fails",
    personaName: "Doug Michaelides",
    personaSummary:
      "Data-savvy budgeter exporting transactions for spreadsheets; frustrated when tooling ignores filters.",
    primaryObjective:
      "Download a CSV that respects his filtered view instead of exporting every transaction from the account.",
    tone: "Exasperated but detailed",
    sentiment: "Highly frustrated",
    scenarioSeed:
      "Doug filters a single card account for specific date ranges before hitting Edit → Download Transactions. The CSV still includes the entire ledger, forcing manual cleanup. He wants to know if this is a bug, whether there’s a hidden option, and if Monarch can prioritize a fix or suggest a workaround.",
    initialUserMessage:
      "I filter my Rogers card for a couple charges, hit Download, and Monarch still spits out the whole account history. Total mess. Is there a way to export just what I filtered or is the button broken?",
    focusCategory: "Transactions",
    sourceNotes:
      "Rooted in support requests from late September 2025 about filtered transaction exports still returning full account histories.",
  },
  {
    id: "investment-price-mismatch",
    personaName: "Terrance Morgan",
    personaSummary:
      "Long-time investor tracking a Schwab target fund; noticed Monarch’s price feed lags the brokerage value.",
    primaryObjective:
      "Get Monarch to reflect the correct SWYJX share price so his portfolio balances line up with Schwab.",
    tone: "Polite but detail-oriented",
    sentiment: "Puzzled and mildly frustrated",
    scenarioSeed:
      "Terrance compared Monarch’s investment tab to Schwab and found the Target Index Fund SWYJX priced several dollars lower in Monarch. He needs to know if Monarch can override the price, switch data providers, or otherwise sync the accurate valuation.",
    initialUserMessage:
      "Hi — my Schwab Target Index Fund (SWYJX) shows the right value at Schwab but Monarch is a few bucks lower. Can Monarch pull the real price or let me tweak it somewhere?",
    focusCategory: "Investments",
    sourceNotes:
      "Taken from September 2025 conversations about SWYJX pricing discrepancies inside the investments breakout view.",
  },
  {
    id: "cancel-during-trial",
    personaName: "Kay Yue",
    personaSummary:
      "Accounting firm owner who tried to cancel during trial but couldn’t find the Manage Subscription link in Billing.",
    primaryObjective:
      "Stop the upcoming charge immediately and receive confirmation the trial won’t bill the card.",
    tone: "Urgent and direct",
    sentiment: "Anxious about unwanted charge",
    scenarioSeed:
      "Kay is still inside the trial window but can’t locate a Manage Subscription button on the Billing page. She emailed support before the charge hits and wants written confirmation the subscription won’t renew.",
    initialUserMessage:
      "Please cancel my trial now—I don’t see any ‘Manage Subscription’ button in Billing and I can’t let the $99.99 charge go through on my Visa.",
    focusCategory: "Billing",
    sourceNotes:
      "Matches Kay Yue’s September 2025 ticket about canceling during trial with no visible billing controls.",
  },
  {
    id: "goals-transfer-missing",
    personaName: "Brandon Harper",
    personaSummary:
      "Robinhood saver moving money into a Monarch goal; wants progress to reflect manual transfers.",
    primaryObjective:
      "Ensure contributions into his Robinhood goal count toward the goal balance without manual edits.",
    tone: "Friendly, slightly confused",
    sentiment: "Curious but expects a solution",
    scenarioSeed:
      "Brandon moved $10 into a Robinhood goal (last four 4139) yet Monarch’s goal tracker didn’t budge. He attached the transfer screenshot and wants to know the right way to record these contributions automatically.",
    initialUserMessage:
      "Dropped $10 into my Robinhood goal (acct ending 4139) last week but Monarch’s goal still shows zero progress. What’s the trick to make those transfers count without updating it by hand?",
    focusCategory: "Goals",
    sourceNotes:
      "Pulled from late September 2025 tickets where customers asked how Robinhood-to-goal transfers should be tracked.",
  },
  {
    id: "rbc-security-loop",
    personaName: "Drew Thompson",
    personaSummary:
      "Canadian user fighting RBC security loops; already answered questions and still can’t connect.",
    primaryObjective:
      "Get Monarch to escalate the Royal Bank of Canada connection that keeps failing after security prompts.",
    tone: "Stressed and ready to escalate",
    sentiment: "Frustrated",
    scenarioSeed:
      "Drew answered every security challenge for his RBC account, but Monarch still returns ‘We ran into a connection issue (11000).’ He’s ready to cancel unless the connection stabilizes or is escalated to the provider.",
    initialUserMessage:
      "I jumped through RBC’s security questions again and Monarch still throws the 11000 connection error. If this isn’t escalated soon I’ll have to cancel—what else can we do?",
    focusCategory: "Connection Issue",
    sourceNotes:
      "Based on the September 2025 RBC escalation ticket where recurring security loops triggered cancellation threats.",
  },
  {
    id: "manual-mortgage-positive-balance",
    personaName: "Marisa Patel",
    personaSummary:
      "Homeowner tracking a manual mortgage who noticed the balance flipped positive after an edit.",
    primaryObjective:
      "Correct the manual mortgage so it remains a liability instead of showing up as a positive asset.",
    tone: "Matter-of-fact, seeks quick fix",
    sentiment: "Concerned about dashboard accuracy",
    scenarioSeed:
      "Marisa updated her manual mortgage account and now Monarch shows a positive balance, inflating net worth. She needs the steps to revert it to a liability without losing history.",
    initialUserMessage:
      "After tweaking my manual mortgage, Monarch flipped it to a positive balance. How do I get it back to a liability so my net worth isn’t wrong?",
    focusCategory: "Settings",
    sourceNotes:
      "Reflects September 2025 threads about manual mortgages appearing as positive assets after edits.",
  },
  {
    id: "recurring-expense-income",
    personaName: "Shannon Reed",
    personaSummary:
      "Budget-minded subscriber whose recurring expense flipped to income after a category edit.",
    primaryObjective:
      "Get a recurring expense back into the correct expense category so budget totals look right.",
    tone: "Annoyed but willing to tweak settings",
    sentiment: "Frustrated",
    scenarioSeed:
      "Shannon reassigned a recurring expense and Monarch now treats it as income, throwing off the budget rollup. She needs the precise steps to restore it without recreating the series from scratch.",
    initialUserMessage:
      "Hey, I edited one of my recurring expenses and now it shows up as income in the budget view. How do I flip it back without rebuilding the whole series?",
    focusCategory: "Budget",
    sourceNotes:
      "Modeled on September 2025 tickets about recurring expenses switching to income after category edits.",
  },
  {
    id: "wealthfront-sync-missing",
    personaName: "Alyssa Chen",
    personaSummary:
      "Product manager syncing Wealthfront accounts; transactions vanish despite healthy connection status.",
    primaryObjective:
      "Restore missing Wealthfront transactions without resorting to manual CSV imports.",
    tone: "Professional, slightly impatient",
    sentiment: "Concerned",
    scenarioSeed:
      "Alyssa’s Wealthfront connection reports healthy, yet no new activity shows up. She needs guidance on refreshing the login, switching providers, or escalating before resorting to manual uploads.",
    initialUserMessage:
      "My Wealthfront account says connected but nothing new is pulling in. Is there a refresh or provider switch that actually brings the transactions back?",
    focusCategory: "Transactions",
    sourceNotes:
      "Based on late September 2025 reports about Wealthfront feeds missing recent activity despite successful syncs.",
  },
  {
    id: "trial-refund-request",
    personaName: "Daniel Cooper",
    personaSummary:
      "New subscriber who was billed right after the trial and is demanding an immediate refund.",
    primaryObjective:
      "Cancel the subscription and secure a refund for the post-trial charge.",
    tone: "Urgent and firm",
    sentiment: "Upset",
    scenarioSeed:
      "Daniel meant to cancel during the trial but was charged anyway. He needs confirmation the account is closed and the charge reversed, plus clarity on the refund timeline."
      ,
    initialUserMessage:
      "I was billed the minute my trial ended even though I tried to cancel. Please refund the charge and confirm my subscription is closed right now.",
    focusCategory: "Refund",
    sourceNotes:
      "Reflects September 2025 refund tickets where customers requested immediate cancellation and charge reversal post-trial.",
  },
  {
    id: "csv-import-duplicates",
    personaName: "Isabel Romero",
    personaSummary:
      "Power user importing CSVs to backfill history; worried about duplicate transactions after repeated uploads.",
    primaryObjective:
      "Understand how Monarch deduplicates CSV imports and how to clean up mistakes safely.",
    tone: "Detail-focused, slightly anxious",
    sentiment: "Cautious",
    scenarioSeed:
      "Isabel imported a CSV twice while experimenting with transaction history and now fears duplicates in Monarch. She wants to know how to spot duplicates, delete them safely, and follow best practices for future imports.",
    initialUserMessage:
      "I uploaded the same CSV twice while testing and now I’m worried Monarch logged duplicates. How can I check and clean that up without nuking legit entries?",
    focusCategory: "Transactions",
    sourceNotes:
      "Drawn from CSV import questions submitted in September 2025 about preventing duplicate transactions during manual uploads.",
  },
  {
    id: "team-invite-sponsorship",
    personaName: "Laura Jennings",
    personaSummary:
      "Advisor sponsoring clients; wants to convert an existing customer under her portal without starting a new login.",
    primaryObjective:
      "Learn how to add an existing Monarch user to her advisor sponsorship without duplicating accounts.",
    tone: "Helpful but pressed for time",
    sentiment: "Expectant",
    scenarioSeed:
      "Laura already has a client in Monarch and needs to sponsor that same account via the advisor portal. She wants the exact steps to send the sponsorship code and confirm the billing handoff works.",
    initialUserMessage:
      "I’m sponsoring a client who already uses Monarch. What’s the quickest way to add them through the advisor portal without forcing a brand-new login?",
    focusCategory: "Connect with Team",
    sourceNotes:
      "Inspired by February–September 2025 advisor tickets about sponsoring existing Monarch accounts via generated codes.",
  },
];
