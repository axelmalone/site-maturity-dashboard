import { Card, CardContent } from "@/components/ui/card";
import { PHASE_NAMES, PHASE_COVERAGE } from "@/lib/phases";

export function PhaseDistribution({
  counts,
}: {
  counts: Record<number, number>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[1, 2, 3, 4].map((phase) => (
        <Card key={phase}>
          <CardContent className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Phase {phase}
              </span>
              <span className="text-2xl font-semibold tabular-nums">
                {counts[phase] ?? 0}
              </span>
            </div>
            <span className="text-sm font-medium">{PHASE_NAMES[phase]}</span>
            <span className="text-muted-foreground text-xs leading-snug">
              {PHASE_COVERAGE[phase]}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
