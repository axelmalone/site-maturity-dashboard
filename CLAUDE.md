# CLAUDE.md — Site Maturity Dashboard

> Read this file BEFORE doing anything in this repo.

## Project identity

This repo is the **Paddington Robotics application prototype** — a Customer Site Maturity Dashboard with a Claude-powered (now OpenAI-powered, see § Runtime) chat interface. It addresses the JD's impressiveness prompt about reducing 4am shifts at customer sites.

The prototype is a **job-application artifact**, not a product. It needs to:
1. Demonstrate strategic thinking about robotics deployment operations
2. Show competent execution (working code, deployed, agent that handles 7 query categories)
3. Stay humble — framed as *"quick prototype I built thinking about how I'd approach this problem"*

Repo path: `/Users/axelmalone/Claude/site-maturity-dashboard/`
Vault (sibling, separate concern): `/Users/axelmalone/Claude/Second Brain/`
**Code stays HERE, vault content stays THERE. Never write code into the vault, never write vault notes into this repo.**

## Status

| # | Step | Status |
|---|---|---|
| 1 | Strategic thesis + README (10 sections, ~650 words) | ✅ DONE — DO NOT REWRITE without explicit ask |
| 2 | Schema (7 tables) + seed (126 rows, sanity-verified) | ✅ DONE — DO NOT REWRITE without explicit ask |
| 3 | Project scaffolding (Next.js + Tailwind + Shadcn + better-sqlite3 + OpenAI SDK + Railway) | ⏳ NEXT |
| 4 | Dashboard core build | Sat 2026-06-06 |
| 5 | Agent layer with 7-question test battery | Sun 2026-06-07 |
| 6 | Polish + deploy + finalise README's `[Railway URL]` placeholder | Sun 2026-06-07 PM |
| 7 | Submit application | Mon 2026-06-08 |

**Submission date: 2026-06-08 (Monday). Time budget for Steps 3-6: 11-16 hours over the weekend.**

## Tech stack (LOCKED — do not add packages or change without flagging)

- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Tailwind + Shadcn UI
- **Database:** SQLite via `better-sqlite3` (synchronous, no ORM)
- **Backend:** Next.js API routes
- **Agent runtime:** OpenAI SDK + **GPT-5 mini** (`gpt-5-mini`) server-side
- **Hosting:** Railway
- **Package manager:** npm
- **NO auth, NO user management, NO test suite, NO CI** — protect time budget. Production would need all four; the prototype scope explicitly doesn't.

## Runtime — agent uses OpenAI / GPT-5 mini (not Claude)

The agent layer uses OpenAI's GPT-5 mini (`gpt-5-mini`) via the OpenAI SDK, server-side. Tactical choice: Axel has an OpenAI API key, does not have an Anthropic key, and the weekend budget cannot absorb provisioning new API access. Mini chosen over full GPT-5: grounded Q&A over a small dataset doesn't need the larger model, and it keeps the bill down. README copy says "GPT-5 mini" to match.

**Implementation:** key lives in Railway env vars (`OPENAI_API_KEY`) and Next.js API route at `/api/chat` calls OpenAI server-side. Browser NEVER sees the key. Reviewers use the deployed URL without needing their own key.

**Cost protection:** add a rate limit on `/api/chat` — **max ~50 queries per session/IP, cached for 24h**. Prevents weird behaviour from spiking Axel's bill. Trivial code, real protection.

## Key files (in priority read order)

1. **`README.md`** — Strategic thesis, four-phase model, 7-question agent test battery, what-this-tool-does bullets. **READ THIS FIRST.** The dashboard exists to operationalise everything in here. Every feature you build should map to a bullet or section in this file.
2. **`db/schema.sql`** — 7-table schema with CHECK constraints + FK refs + 10 indexes
3. **`db/seed.sql`** — 126 rows: 10 sites, 13 robots, 30 shifts, 26 incidents, 15 customer concerns, 22 phase transitions, 10 phase blockers. Site 5 (Tesco Express Clapham Junction) is the deliberately seeded "ready to progress" demo site — fully meets Phase 3 entry criteria (62 days in Phase 2, 91% autonomy, 100% remote resolution), so the readiness surface fires a green state. Tesco Metro Holborn (site 9) remains the diagnostic example: blocked from Phase 4 by its 2026-05-10 critical incident inside the 30-day window.

**Vault notes (full strategic context, NOT in this repo — read with `Read` tool by absolute path):**
- `/Users/axelmalone/Claude/Second Brain/02 Projects/Job Hunt/Paddington Robotics/Paddington Robotics — Application Answers.md` (full prototype scope incl. agent test battery + tech stack rationale)
- `/Users/axelmalone/Claude/Second Brain/02 Projects/Job Hunt/Paddington Robotics/Prototype — Build Log.md` (decisions log, sequencing, dev sessions)
- `/Users/axelmalone/Claude/Second Brain/02 Projects/Job Hunt/Paddington Robotics/Paddington Robotics — Company Profile.md` (who Paddington are, who's evaluating)
- `/Users/axelmalone/Claude/Second Brain/Knowledge/ADR-2026-06-02 — Paddington prototype build environment.md` (why code is OUTSIDE the vault, why Claude Code primary)

## Reference date

```typescript
// lib/config.ts
export const REFERENCE_DATE = '2026-06-02';
```

**HARDCODE this date.** All "days deployed" / "days in phase" / "incidents in last N days" calculations subtract from `REFERENCE_DATE`. **NEVER use `Date.now()` / `new Date()` for phase-progression math.** The demo data is deterministic regardless of when the reviewer views it. If Axel says "make it feel current" later, that's a separate decision — default is fixed.

## Phase progression criteria (LOCKED — cross-referenced in README + seed + phase_blockers)

| From | To | Criteria |
|---|---|---|
| (none) | 1 | Initial deployment |
| 1 | 2 | 30+ days operating · autonomy ≥0.80 · no unresolved customer concerns |
| 2 | 3 | 60+ days in Phase 2 · autonomy ≥0.90 · ≥50% of incidents resolved remotely |
| 3 | 4 | 90+ days in Phase 3 · autonomy ≥0.95 · no critical incidents in 30 days |

Coverage shape per phase:
- **Phase 1** — Daily 4am shifts on-site, full daytime support
- **Phase 2** — On-call 4am rotation (one person covers three sites), reduced daytime
- **Phase 3** — Remote monitoring, in-person only for exceptions
- **Phase 4** — Weekly check-ins

These thresholds appear in seed data (every `phase_blockers` row references them), every dashboard surface (compute "should-be-phase" derived from data), and the README's main table. Change in one place = change everywhere.

## Dashboard surfaces to build (priority order from README)

These map directly to the README's *"What this tool does"* bullets + agent test battery:

1. **Sites list (main page `/`)** — table: site_name · customer · area · current_phase · days_in_phase · avg_autonomy · open_blockers_count. Sortable. This is what reviewers see first.
2. **Site detail (`/sites/[id]`)** — for each site: phase + days in phase, robots + their autonomy, recent incidents (last 30 days), open customer concerns, phase blockers (what's stopping next-phase progression), phase transition history.
3. **Ready-to-progress surface (`/ready` or main page section)** — sites where derived should-be-phase > stored current_phase. This is the "Flags sites ready to progress" bullet — the differentiator surface.
4. **Blockers view (`/blockers` or section)** — every active blocker across all sites, ordered by proximity to resolution (sites closest to next phase first).
5. **Chat interface (sticky panel or `/chat`)** — natural-language queries to GPT-5 mini grounded in dashboard data. Must answer the 7 question categories from the README.

If time runs short on Sunday: **agent layer is the differentiator, ship it.** Cut from the dashboard side first (e.g. skip the dedicated blockers view, fold into site detail).

## Suggested file structure

```
app/
├── page.tsx                  # main dashboard: sites list + phase distribution + ready-to-progress
├── sites/[id]/page.tsx       # site detail
├── api/
│   ├── sites/route.ts        # GET all sites with computed fields
│   ├── sites/[id]/route.ts   # GET single site with all related data
│   ├── ready/route.ts        # GET sites where derived > stored phase
│   ├── blockers/route.ts     # GET all active blockers
│   └── chat/route.ts         # POST → OpenAI with grounding context
components/
├── ui/                       # shadcn primitives (button, card, table, dialog, etc.)
├── SitesTable.tsx
├── PhaseDistribution.tsx
├── ReadyToProgress.tsx
├── BlockersList.tsx
├── ChatPanel.tsx
lib/
├── db.ts                     # better-sqlite3 singleton + init logic
├── config.ts                 # REFERENCE_DATE + other constants
├── phases.ts                 # derived phase computation per the locked criteria
├── queries.ts                # all SQL queries used by API routes
└── openai.ts                 # OpenAI client + system prompt + grounding context builder
db/
├── schema.sql                # EXISTS — do not modify
└── seed.sql                  # EXISTS — do not modify
data/                         # gitignored, app.db lives here
.env.example                  # template with OPENAI_API_KEY=<your key>
.env.local                    # gitignored, real key
```

## Database init pattern (suggested)

```typescript
// lib/db.ts
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'app.db');
const SCHEMA_PATH = path.join(process.cwd(), 'db', 'schema.sql');
const SEED_PATH = path.join(process.cwd(), 'db', 'seed.sql');

function initDb() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');
  
  // Idempotent: only seed if sites table is empty
  const hasSites = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='sites'"
  ).get();
  
  if (!hasSites) {
    db.exec(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
    db.exec(fs.readFileSync(SEED_PATH, 'utf-8'));
  }
  
  return db;
}

let _db: Database.Database | null = null;
export function getDb() {
  if (!_db) _db = initDb();
  return _db;
}
```

For Railway: `npm run build` step may need to invoke a script that pre-populates `data/app.db`, or the lazy init above handles first-request bootstrapping. Pick whichever is cleaner.

## Style discipline for any prose Claude writes (README, ROADMAP, UI copy, agent responses)

These are Axel's voice rules drilled into the README:

- **0 em-dashes in body prose.** Em-dashes only allowed as typographic separators in numbered lists / bold-label-value pairs (see existing README for the pattern).
- **0 setup-payoff colons.** Banned: *"There's one rule for X: don't do Y."* Restructure as two sentences or a different rhetorical move.
- **0 hedge intensifiers.** Banned: *really, very, incredibly, super, extremely.*
- **0 reframe-bait constructions.** Banned: *"X is a symptom, not the cause"*, *"the real question isn't X, it's Y"*, etc.
- **0 X-vs-Y echo structures** unless making a genuine content-bearing reframe.
- **British spelling.** *Concretises, labour, colour, organisation, programme.*
- **Longer flowing sentences mixed with shorter punchy ones.** Matches Axel's voice. Don't write in equal-length sentences.
- **Banned vocab:** *thrilled, excited, vague enthusiasm words, "leverage", "ecosystem", "synergy", "unlock", "supercharge"*.
- **No AI-tells.** Anything that screams *"ChatGPT wrote this"* gets killed.

When in doubt: read existing README.md and match the register exactly.

## Anti-patterns (DO NOT)

- ❌ Rewrite the README without explicit ask. Drafted sentence-by-sentence over a focused session.
- ❌ Change the schema without ask. Sanity-verified.
- ❌ Change seed data without ask. Sanity-verified across 5 dimensions.
- ❌ Change phase progression thresholds (0.80 / 0.90 / 0.95, 30/60/90 days). Cross-referenced everywhere.
- ❌ Use `Date.now()` / `new Date()` for phase math. Use `REFERENCE_DATE` from `lib/config.ts`.
- ❌ Add auth, user management, tests, or CI. Out of scope.
- ❌ Add packages beyond the locked stack without flagging. (Shadcn primitives + `clsx`/`tailwind-merge`/similar Shadcn deps are fine — they're part of the stack.)
- ❌ Wrap unnecessary abstractions around `better-sqlite3`. It's intended to be used directly (synchronous SQL, no ORM).
- ❌ Use marketing voice in UI copy. *"Quick prototype"* framing, not *"production-grade solution"*.
- ❌ Replace `[Railway URL]` placeholder in README until the deploy is real and stable.

## Patterns (DO)

- ✅ Read README.md before any feature work
- ✅ Update `Prototype — Build Log.md` in the vault at end of each session with what shipped + what didn't. Use the absolute path: `/Users/axelmalone/Claude/Second Brain/02 Projects/Job Hunt/Paddington Robotics/Prototype — Build Log.md`
- ✅ Run `npm run build` + `npm run lint` before considering anything done
- ✅ Test all 7 agent query categories (lookup / aggregation / ranking / reasoning / operational / diagnostic / trend) against seed data before declaring agent done
- ✅ Add rate limit on `/api/chat` before deploy
- ✅ Use `db.prepare(...)` and bind parameters — no string concatenation into SQL
- ✅ Keep API responses thin — heavy computation server-side, UI just renders
- ✅ Commit atomically with messages explaining the why (no "fix" or "wip" commits)

## Submission framing — internalise this

The submission to Paddington is framed as: ***"Quick prototype I built thinking about how I'd approach this problem. Spent ~weekend on it, happy to iterate."***

This is the humble framing that protects against the overclaim risk. Anything in the UI / README / commit messages that contradicts this framing should be killed.

| ❌ Don't say | ✅ Do say |
|---|---|
| "Our proposed solution" | "A way of making the thinking concrete" |
| "The complete dashboard" | "Synthetic data, real data model" |
| "Production-ready" | "Quick prototype" |
| "Built with industry best practices" | "Built over a weekend" |
| "Enterprise-grade" | "Built to demonstrate the approach" |

## End-of-session checklist (run before stopping any work session)

1. `npm run build` passes
2. `npm run lint` passes (or warnings explained)
3. Update `/Users/axelmalone/Claude/Second Brain/02 Projects/Job Hunt/Paddington Robotics/Prototype — Build Log.md` with:
   - Dev session row appended (date, focus, output, brief notes)
   - Step status updated if a step completed
   - Any new key decisions added to the Key Decisions section
4. Commit + push if anything shipped
5. **On deploy night specifically:** replace `[Railway URL]` placeholder in README with real URL, commit the README update separately, redeploy so the deployed README is current.

## Quick-reference values

- Reference date: `2026-06-02`
- Total seeded sites: 10 (3 P1 · 3 P2 · 3 P3 · 1 P4)
- Total seeded robots: 13
- Phase 4 site: Morrisons Wandsworth
- Sole site with critical-incident-in-30-days blocker: Tesco Metro Holborn (site_id 9, incident 2026-05-10)
- David Okonkwo covers the Phase 2 on-call rotation across sites 4, 5, 6
- Team members: Marcus Chen · Priya Patel · James O'Brien · Sofia Martinez · David Okonkwo · Hannah Wright
- Robot models: PA-1 (older, autonomy ceiling ~0.97 in mature deployments) · PA-2 (newer, deployed 2026+)

---

*This file written 2026-06-02 PM by Claudian (Claude inside Obsidian) at the end of the planning + README + schema + seed session, immediately before handing off the build to Claude Code. Steps 1 and 2 already complete on disk. Claude Code picks up at Step 3.*
