import { getSiteSummaries, getProgressionReadiness } from "@/lib/queries";
import { REFERENCE_DATE } from "@/lib/config";
import { PhaseDistribution } from "@/components/PhaseDistribution";
import { SitesTable } from "@/components/SitesTable";
import { ReadyToProgress } from "@/components/ReadyToProgress";

// Read live from the seeded SQLite database at request time.
export const dynamic = "force-dynamic";

export default function Home() {
  const sites = getSiteSummaries();
  const readiness = getProgressionReadiness();

  const counts: Record<number, number> = {};
  for (const s of sites) {
    counts[s.current_phase] = (counts[s.current_phase] ?? 0) + 1;
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-2">
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">
          Quick prototype
        </p>
        <h1 className="text-3xl font-semibold">Site Maturity Dashboard</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Where each customer site sits in its deployment maturity, and what
          would unlock the next phase. Less time on site at 4am becomes visible
          once you can see which sites are close to progressing. Synthetic data,
          real data model. Reference date{" "}
          <span className="font-mono">{REFERENCE_DATE}</span>.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Phase distribution</h2>
        <PhaseDistribution counts={counts} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Progression readiness</h2>
        <ReadyToProgress sites={readiness} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">All sites</h2>
        <p className="text-muted-foreground text-sm">
          Click a column header to sort. Click a site to see robots, incidents,
          concerns, blockers, and its phase history.
        </p>
        <div className="rounded-lg border">
          <SitesTable sites={sites} />
        </div>
      </section>

      <footer className="text-muted-foreground border-t pt-6 text-xs">
        Built over a weekend to make the thinking concrete. The data model,
        phase criteria, and the logic that surfaces blockers and ready-to-progress
        sites are real; the site data is synthetic.
      </footer>
    </main>
  );
}
