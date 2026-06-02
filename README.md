# Site Maturity Dashboard

I built this in a day thinking about how to reduce the number of 4am shifts at customer sites. The dashboard concretises the thinking rather than being a completed solution. It consists of a real data model and logic, with synthetic data for ten sample UK supermarket sites.

## The problem

Most of what the team does at 4am isn't robotics work. It's standing by while the robot operates, ready to step in if something goes wrong. That coverage exists because customer trust takes time to build, autonomy has to be validated environment by environment, and customers need to see humans accountable until they trust the system.

## The thesis

The gap in most deployments is that nothing tracks what would unlock the next phase of maturity for each site. A customer site at week 2 of deployment needs different coverage than one at month 6, and sites stay in early phases longer than they need to because the work that would move them forward isn't visible. Tracking site maturity enables a better understanding of where 4am shift reductions can first take place.

## The phases

Sites move through four phases. Each has criteria that have to be satisfied before progression to the next, and a coverage shape that comes with it.

*Autonomy here is the share of operating hours the robot ran without human intervention.*

| Phase | Entry criteria | Coverage |
|---|---|---|
| **1 — Full Support** | Initial deployment | Daily 4am shifts on-site, full daytime support |
| **2 — Reduced** | 30+ days operating · autonomy ≥80% · no unresolved customer concerns | On-call 4am rotation (one person covers three sites), reduced daytime |
| **3 — Remote Monitoring** | 60+ days in Phase 2 · autonomy ≥90% · ≥50% of incidents resolved remotely | Remote monitoring, in-person only for exceptions |
| **4 — Autonomous** | 90+ days in Phase 3 · autonomy ≥95% · no critical incidents in 30 days | Weekly check-ins |

The specific thresholds in this dashboard are illustrative. In a real deployment they would be calibrated against incident data over the first few months of operation rather than set up front.

## What this tool does

- **Shows where each customer site sits in the maturity progression**, including how long it's been in its current phase
- **Surfaces what's blocking each site from progressing** to the next phase, so the path forward is visible
- **Flags sites ready to progress to the next phase**, where 4am shift reductions are immediately available

## Note on synthetic data

The data is synthetic. Ten sample sites across UK supermarket brands (Tesco Express Hammersmith, Sainsbury's Local Camden Town, and similar) with fabricated deployment dates, autonomy scores, incident logs, and shift records. Real brand names appear so the dashboard renders with familiar context, with no implication that any of these companies are actual customers.

The data model, the phase progression criteria, and the logic that surfaces blockers and ready-to-progress sites are all real. They would survive review against an actual deployment.

## The agent layer

The dashboard sits behind a chat interface powered by GPT-5. You can ask questions in natural language and get answers grounded in the dashboard's data rather than in model knowledge.

Seven question categories were used to test it:

1. **Lookup** — *"How many sites are in Phase 2?"*
2. **Aggregation** — *"What's the average autonomy score across Phase 3 sites?"*
3. **Ranking** — *"Which sites have been in Phase 1 the longest?"*
4. **Reasoning** — *"Which site is most ready to progress to Phase 2?"*
5. **Operational** — *"How many 4am shifts could we eliminate this month if we progressed every site that's eligible?"*
6. **Diagnostic** — *"Why is Tesco Hammersmith still in Phase 1?"*
7. **Trend** — *"Which sites have improved most over the last 30 days?"*

The categories matter more than the specific questions. A useful agent has to handle reasoning, diagnostic, and trend questions, not just lookup and aggregation. The first three are the work that makes the dashboard useful to someone making operational decisions.

## What I'd do next

- Calibrate the phase thresholds against real incident data once the first three months of real operating data exist
- Translate shift reductions into cost and labour-hour savings so shift-reduction recommendations come with a £ number attached
- Forecast when each site will hit the next phase based on current trajectory
- Use patterns from mature sites to accelerate new ones by identifying which interventions correlate with faster phase progression
- Build a consistent incident classification taxonomy so "critical" vs "minor" means the same thing across sites

## Tech stack

- **Framework** — Next.js (App Router)
- **Styling** — Tailwind + Shadcn UI
- **Database** — SQLite via `better-sqlite3`
- **Backend** — Next.js API routes
- **Agent** — OpenAI SDK + GPT-5
- **Hosting** — Railway

No auth, no user management, no test suite, no CI. The prototype scope didn't justify the time. Production would need all four.

## Live demo

The deployed version runs at `[Railway URL]`. Dashboard and agent both work without setup. The agent calls OpenAI server-side using a configured API key, so nothing is needed on the reviewer's end.

To run locally:

```bash
npm install
cp .env.example .env  # add your own OPENAI_API_KEY for the agent
npm run dev
```

Visit `http://localhost:3000`. The dashboard renders without a key; the agent requires one for local dev only.
