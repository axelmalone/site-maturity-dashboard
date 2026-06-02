import { REFERENCE_DATE } from "@/lib/config";

export const PHASE_NAMES: Record<number, string> = {
  1: "Full Support",
  2: "Reduced",
  3: "Remote Monitoring",
  4: "Autonomous",
};

export const PHASE_COVERAGE: Record<number, string> = {
  1: "Daily 4am shifts on-site, full daytime support",
  2: "On-call 4am rotation (one person covers three sites), reduced daytime",
  3: "Remote monitoring, in-person only for exceptions",
  4: "Weekly check-ins",
};

// Whole days between two ISO dates (toDate - fromDate), against REFERENCE_DATE
// for the "to" side by default. Never uses the wall clock.
export function daysSince(isoDate: string, to: string = REFERENCE_DATE): number {
  const ms = Date.parse(to) - Date.parse(isoDate);
  return Math.floor(ms / 86_400_000);
}

// Raw metrics computed from the database for a single site.
export interface SiteMetrics {
  daysOperating: number;
  daysInCurrentPhase: number;
  avgAutonomy: number; // 0-1
  openConcerns: number;
  totalIncidents: number;
  remoteResolutionRate: number; // 0-1
  criticalIncidents30d: number;
}

export interface Criterion {
  label: string;
  current: string;
  required: string;
  met: boolean;
  progress: number; // 0-1, how close to the threshold (1 = met)
}

export interface Readiness {
  nextPhase: number | null; // null when already Phase 4
  criteria: Criterion[];
  ready: boolean;
  metCount: number;
  total: number;
  proximity: number; // mean progress across criteria, for closest-first ranking
}

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

// Criteria to advance from the given current phase to the next, evaluated
// against the locked thresholds (see README + CLAUDE.md).
export function nextPhaseCriteria(
  currentPhase: number,
  m: SiteMetrics
): Criterion[] {
  if (currentPhase === 1) {
    return [
      ratio("Days operating", m.daysOperating, 30, (v) => `${v}`),
      ratio("Average autonomy", m.avgAutonomy, 0.8, pct),
      zero("Unresolved customer concerns", m.openConcerns),
    ];
  }
  if (currentPhase === 2) {
    return [
      ratio("Days in Phase 2", m.daysInCurrentPhase, 60, (v) => `${v}`),
      ratio("Average autonomy", m.avgAutonomy, 0.9, pct),
      ratio(
        "Incidents resolved remotely",
        m.remoteResolutionRate,
        0.5,
        pct
      ),
    ];
  }
  if (currentPhase === 3) {
    return [
      ratio("Days in Phase 3", m.daysInCurrentPhase, 90, (v) => `${v}`),
      ratio("Average autonomy", m.avgAutonomy, 0.95, pct),
      zero("Critical incidents in last 30 days", m.criticalIncidents30d),
    ];
  }
  return [];
}

// A "reach this threshold or higher" criterion.
function ratio(
  label: string,
  current: number,
  required: number,
  fmt: (v: number) => string
): Criterion {
  return {
    label,
    current: fmt(current),
    required: fmt(required),
    met: current >= required,
    progress: Math.min(current / required, 1),
  };
}

// A "must be zero" criterion.
function zero(label: string, current: number): Criterion {
  return {
    label,
    current: `${current}`,
    required: "0",
    met: current === 0,
    progress: current === 0 ? 1 : 0,
  };
}

export function computeReadiness(
  currentPhase: number,
  m: SiteMetrics
): Readiness {
  if (currentPhase >= 4) {
    return {
      nextPhase: null,
      criteria: [],
      ready: false,
      metCount: 0,
      total: 0,
      proximity: 1,
    };
  }
  const criteria = nextPhaseCriteria(currentPhase, m);
  const metCount = criteria.filter((c) => c.met).length;
  const proximity =
    criteria.reduce((sum, c) => sum + c.progress, 0) / criteria.length;
  return {
    nextPhase: currentPhase + 1,
    criteria,
    ready: metCount === criteria.length,
    metCount,
    total: criteria.length,
    proximity,
  };
}
