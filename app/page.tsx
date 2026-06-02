import { getDb } from "@/lib/db";
import { REFERENCE_DATE } from "@/lib/config";

// Read live from the seeded SQLite database at request time.
export const dynamic = "force-dynamic";

type PhaseRow = { current_phase: number; count: number };

const PHASE_LABELS: Record<number, string> = {
  1: "Full Support",
  2: "Reduced",
  3: "Remote Monitoring",
  4: "Autonomous",
};

export default function Home() {
  const db = getDb();

  const { total } = db
    .prepare("SELECT COUNT(*) AS total FROM sites")
    .get() as { total: number };

  const phaseRows = db
    .prepare(
      "SELECT current_phase, COUNT(*) AS count FROM sites GROUP BY current_phase ORDER BY current_phase"
    )
    .all() as PhaseRow[];

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-xs uppercase tracking-widest text-slate-400">
          Quick prototype
        </p>
        <h1 className="text-3xl font-semibold">Site Maturity Dashboard</h1>
        <p className="text-sm text-slate-500">
          Tracking where each customer site sits in its deployment maturity, so
          that 4am shift reductions become visible. Synthetic data, real data
          model.
        </p>
      </header>

      <section className="rounded-lg border border-slate-200 p-6 dark:border-slate-800">
        <p className="text-sm text-slate-500">
          Scaffolding is live. The seeded database is wired in and serving{" "}
          <span className="font-semibold text-foreground">{total}</span> sites
          as of the reference date{" "}
          <span className="font-mono text-foreground">{REFERENCE_DATE}</span>.
        </p>

        <ul className="mt-4 flex flex-col gap-1 font-mono text-sm">
          {phaseRows.map((row) => (
            <li key={row.current_phase} className="flex justify-between">
              <span className="text-slate-500">
                Phase {row.current_phase} — {PHASE_LABELS[row.current_phase]}
              </span>
              <span className="font-semibold">{row.count}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-slate-400">
        Dashboard surfaces and the GPT-5 agent layer come next.
      </p>
    </main>
  );
}
