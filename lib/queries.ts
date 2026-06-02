import { getDb } from "@/lib/db";
import { REFERENCE_DATE } from "@/lib/config";
import {
  computeReadiness,
  daysSince,
  type Readiness,
  type SiteMetrics,
} from "@/lib/phases";

export interface SiteSummary {
  site_id: number;
  site_name: string;
  customer_name: string;
  store_format: string;
  city: string;
  area: string;
  current_phase: number;
  deployment_date: string;
  robotCount: number;
  daysOperating: number;
  daysInCurrentPhase: number;
  avgAutonomy: number;
  openConcerns: number;
  openBlockers: number;
  metrics: SiteMetrics;
  readiness: Readiness;
}

interface SiteAggregateRow {
  site_id: number;
  site_name: string;
  customer_name: string;
  store_format: string;
  city: string;
  area: string;
  current_phase: number;
  deployment_date: string;
  phase_entry_date: string | null;
  robot_count: number;
  avg_autonomy: number | null;
  open_concerns: number;
  open_blockers: number;
  total_incidents: number;
  remote_incidents: number;
  critical_30d: number;
}

const SITE_AGGREGATE_SQL = `
  SELECT
    s.site_id,
    s.site_name,
    s.customer_name,
    s.store_format,
    s.city,
    s.area,
    s.current_phase,
    s.deployment_date,
    (SELECT MAX(pt.transition_date) FROM phase_transitions pt
       WHERE pt.site_id = s.site_id AND pt.to_phase = s.current_phase) AS phase_entry_date,
    (SELECT COUNT(*) FROM robots r
       WHERE r.site_id = s.site_id) AS robot_count,
    (SELECT AVG(r.autonomy_score) FROM robots r
       WHERE r.site_id = s.site_id) AS avg_autonomy,
    (SELECT COUNT(*) FROM customer_concerns cc
       WHERE cc.site_id = s.site_id AND cc.status = 'open') AS open_concerns,
    (SELECT COUNT(*) FROM phase_blockers pb
       WHERE pb.site_id = s.site_id) AS open_blockers,
    (SELECT COUNT(*) FROM incidents i
       WHERE i.site_id = s.site_id) AS total_incidents,
    (SELECT COUNT(*) FROM incidents i
       WHERE i.site_id = s.site_id AND i.resolved_remotely = 1) AS remote_incidents,
    (SELECT COUNT(*) FROM incidents i
       WHERE i.site_id = s.site_id AND i.severity = 'critical'
         AND julianday(@ref) - julianday(i.date) <= 30) AS critical_30d
  FROM sites s
`;

function toSummary(row: SiteAggregateRow): SiteSummary {
  const avgAutonomy = row.avg_autonomy ?? 0;
  const daysOperating = daysSince(row.deployment_date);
  const daysInCurrentPhase = row.phase_entry_date
    ? daysSince(row.phase_entry_date)
    : daysOperating;
  const remoteResolutionRate =
    row.total_incidents > 0 ? row.remote_incidents / row.total_incidents : 1;

  const metrics: SiteMetrics = {
    daysOperating,
    daysInCurrentPhase,
    avgAutonomy,
    openConcerns: row.open_concerns,
    totalIncidents: row.total_incidents,
    remoteResolutionRate,
    criticalIncidents30d: row.critical_30d,
  };

  return {
    site_id: row.site_id,
    site_name: row.site_name,
    customer_name: row.customer_name,
    store_format: row.store_format,
    city: row.city,
    area: row.area,
    current_phase: row.current_phase,
    deployment_date: row.deployment_date,
    robotCount: row.robot_count,
    daysOperating,
    daysInCurrentPhase,
    avgAutonomy,
    openConcerns: row.open_concerns,
    openBlockers: row.open_blockers,
    metrics,
    readiness: computeReadiness(row.current_phase, metrics),
  };
}

export function getSiteSummaries(): SiteSummary[] {
  const db = getDb();
  const rows = db
    .prepare(`${SITE_AGGREGATE_SQL} ORDER BY s.site_id`)
    .all({ ref: REFERENCE_DATE }) as SiteAggregateRow[];
  return rows.map(toSummary);
}

export function getPhaseDistribution(): { phase: number; count: number }[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT current_phase AS phase, COUNT(*) AS count
         FROM sites GROUP BY current_phase ORDER BY current_phase`
    )
    .all() as { phase: number; count: number }[];
}

// Non-Phase-4 sites ranked closest-first toward their next phase.
export function getProgressionReadiness(): SiteSummary[] {
  return getSiteSummaries()
    .filter((s) => s.current_phase < 4)
    .sort((a, b) => {
      if (a.readiness.ready !== b.readiness.ready)
        return a.readiness.ready ? -1 : 1;
      return b.readiness.proximity - a.readiness.proximity;
    });
}

export interface Robot {
  robot_id: number;
  model: string;
  deployment_date: string;
  status: string;
  autonomy_score: number;
  last_incident_date: string | null;
}

export interface Incident {
  incident_id: number;
  date: string;
  category: string;
  severity: string;
  required_human_intervention: number;
  resolved_remotely: number;
  resolution_time_minutes: number | null;
  status: string;
}

export interface Concern {
  concern_id: number;
  raised_date: string;
  raised_by: string;
  description: string;
  severity: string;
  status: string;
  resolved_date: string | null;
}

export interface Blocker {
  blocker_id: number;
  blocker_description: string;
  target_metric: string;
  current_value: string;
  required_value: string;
  estimated_resolution_date: string | null;
  created_date: string;
}

export interface Transition {
  transition_id: number;
  from_phase: number | null;
  to_phase: number;
  transition_date: string;
  days_in_previous_phase: number | null;
}

export interface SiteDetail {
  site: SiteSummary;
  robots: Robot[];
  recentIncidents: Incident[];
  openConcerns: Concern[];
  blockers: Blocker[];
  transitions: Transition[];
}

export function getSiteDetail(siteId: number): SiteDetail | null {
  const db = getDb();
  const row = db
    .prepare(`${SITE_AGGREGATE_SQL} WHERE s.site_id = @id`)
    .get({ ref: REFERENCE_DATE, id: siteId }) as SiteAggregateRow | undefined;
  if (!row) return null;

  const robots = db
    .prepare(
      `SELECT robot_id, model, deployment_date, status, autonomy_score, last_incident_date
         FROM robots WHERE site_id = ? ORDER BY robot_id`
    )
    .all(siteId) as Robot[];

  const recentIncidents = db
    .prepare(
      `SELECT incident_id, date, category, severity, required_human_intervention,
              resolved_remotely, resolution_time_minutes, status
         FROM incidents
        WHERE site_id = @id AND julianday(@ref) - julianday(date) <= 30
        ORDER BY date DESC`
    )
    .all({ id: siteId, ref: REFERENCE_DATE }) as Incident[];

  const openConcerns = db
    .prepare(
      `SELECT concern_id, raised_date, raised_by, description, severity, status, resolved_date
         FROM customer_concerns
        WHERE site_id = ? AND status = 'open'
        ORDER BY raised_date DESC`
    )
    .all(siteId) as Concern[];

  const blockers = db
    .prepare(
      `SELECT blocker_id, blocker_description, target_metric, current_value,
              required_value, estimated_resolution_date, created_date
         FROM phase_blockers WHERE site_id = ? ORDER BY blocker_id`
    )
    .all(siteId) as Blocker[];

  const transitions = db
    .prepare(
      `SELECT transition_id, from_phase, to_phase, transition_date, days_in_previous_phase
         FROM phase_transitions WHERE site_id = ? ORDER BY transition_date`
    )
    .all(siteId) as Transition[];

  return {
    site: toSummary(row),
    robots,
    recentIncidents,
    openConcerns,
    blockers,
    transitions,
  };
}

export interface BlockerWithSite extends Blocker {
  site_id: number;
  site_name: string;
  current_phase: number;
  nextPhase: number | null;
  proximity: number;
}

// Every active blocker across all sites, ordered by proximity to resolution
// (sites closest to their next phase first).
export function getAllBlockers(): BlockerWithSite[] {
  const db = getDb();
  const summaries = new Map(getSiteSummaries().map((s) => [s.site_id, s]));

  const rows = db
    .prepare(
      `SELECT pb.blocker_id, pb.site_id, pb.blocker_description, pb.target_metric,
              pb.current_value, pb.required_value, pb.estimated_resolution_date,
              pb.created_date, s.site_name, s.current_phase
         FROM phase_blockers pb
         JOIN sites s ON s.site_id = pb.site_id`
    )
    .all() as (Blocker & {
    site_id: number;
    site_name: string;
    current_phase: number;
  })[];

  return rows
    .map((r) => {
      const summary = summaries.get(r.site_id);
      return {
        ...r,
        nextPhase: summary?.readiness.nextPhase ?? null,
        proximity: summary?.readiness.proximity ?? 0,
      };
    })
    .sort((a, b) => b.proximity - a.proximity);
}

// Compact, fully-grounded snapshot of the whole dataset for the agent.
// Everything the model is allowed to reason over lives here.
export function getAgentContext() {
  const db = getDb();
  const summaries = getSiteSummaries();

  const robots = db
    .prepare(
      `SELECT site_id, robot_id, model, status, autonomy_score, last_incident_date
         FROM robots ORDER BY robot_id`
    )
    .all() as (Robot & { site_id: number })[];

  const blockers = db
    .prepare(
      `SELECT site_id, blocker_description, target_metric, current_value,
              required_value, estimated_resolution_date
         FROM phase_blockers ORDER BY blocker_id`
    )
    .all() as (Pick<
    Blocker,
    | "blocker_description"
    | "target_metric"
    | "current_value"
    | "required_value"
    | "estimated_resolution_date"
  > & { site_id: number })[];

  const concerns = db
    .prepare(
      `SELECT site_id, raised_date, raised_by, description, severity, status
         FROM customer_concerns ORDER BY raised_date`
    )
    .all() as (Pick<
    Concern,
    "raised_date" | "raised_by" | "description" | "severity" | "status"
  > & { site_id: number })[];

  const transitions = db
    .prepare(
      `SELECT site_id, from_phase, to_phase, transition_date, days_in_previous_phase
         FROM phase_transitions ORDER BY transition_date`
    )
    .all() as (Transition & { site_id: number })[];

  const shiftsByTypePhase = db
    .prepare(
      `SELECT s.current_phase AS phase, sh.shift_type, COUNT(*) AS count
         FROM shifts sh JOIN sites s ON s.site_id = sh.site_id
        GROUP BY s.current_phase, sh.shift_type
        ORDER BY s.current_phase, sh.shift_type`
    )
    .all() as { phase: number; shift_type: string; count: number }[];

  // Periodised incident counts so the agent can reason about trends, not just totals.
  const incidentsByMonth = db
    .prepare(
      `SELECT strftime('%Y-%m', date) AS month,
              COUNT(*) AS total,
              SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) AS critical,
              SUM(CASE WHEN resolved_remotely = 1 THEN 1 ELSE 0 END) AS resolved_remotely
         FROM incidents
        GROUP BY month ORDER BY month`
    )
    .all() as {
    month: string;
    total: number;
    critical: number;
    resolved_remotely: number;
  }[];

  const incidents = db
    .prepare(
      `SELECT site_id, date, category, severity, resolved_remotely
         FROM incidents ORDER BY date`
    )
    .all() as {
    site_id: number;
    date: string;
    category: string;
    severity: string;
    resolved_remotely: number;
  }[];

  const byId = <T extends { site_id: number }>(rows: T[], id: number) =>
    rows.filter((r) => r.site_id === id);

  return {
    referenceDate: REFERENCE_DATE,
    phaseCriteria: {
      "1to2": "30+ days operating, avg autonomy >= 80%, no unresolved customer concerns",
      "2to3": "60+ days in Phase 2, avg autonomy >= 90%, >= 50% of incidents resolved remotely",
      "3to4": "90+ days in Phase 3, avg autonomy >= 95%, no critical incidents in the last 30 days",
    },
    coverageByPhase: {
      "1": "Daily 4am shifts on-site, full daytime support",
      "2": "On-call 4am rotation (one person covers three sites), reduced daytime",
      "3": "Remote monitoring, in-person only for exceptions",
      "4": "Weekly check-ins",
    },
    phaseDistribution: getPhaseDistribution(),
    shiftsByTypePhase,
    incidentsByMonth,
    sites: summaries.map((s) => ({
      site_id: s.site_id,
      site_name: s.site_name,
      customer: s.customer_name,
      store_format: s.store_format,
      area: s.area,
      city: s.city,
      current_phase: s.current_phase,
      deployment_date: s.deployment_date,
      days_operating: s.daysOperating,
      days_in_current_phase: s.daysInCurrentPhase,
      robot_count: s.robotCount,
      avg_autonomy: Number(s.avgAutonomy.toFixed(3)),
      open_concerns: s.openConcerns,
      open_blockers: s.openBlockers,
      remote_resolution_rate: Number(s.metrics.remoteResolutionRate.toFixed(3)),
      total_incidents: s.metrics.totalIncidents,
      critical_incidents_30d: s.metrics.criticalIncidents30d,
      readiness: {
        next_phase: s.readiness.nextPhase,
        ready_now: s.readiness.ready,
        criteria_met: `${s.readiness.metCount}/${s.readiness.total}`,
        proximity: Number(s.readiness.proximity.toFixed(3)),
        criteria: s.readiness.criteria.map((c) => ({
          label: c.label,
          current: c.current,
          required: c.required,
          met: c.met,
        })),
      },
      robots: byId(robots, s.site_id).map((r) => ({
        robot_id: r.robot_id,
        model: r.model,
        status: r.status,
        autonomy_score: r.autonomy_score,
      })),
      blockers: byId(blockers, s.site_id).map((b) => ({
        description: b.blocker_description,
        metric: b.target_metric,
        current: b.current_value,
        required: b.required_value,
        est_resolution: b.estimated_resolution_date,
      })),
      open_concern_details: byId(concerns, s.site_id)
        .filter((c) => c.status === "open")
        .map((c) => ({
          description: c.description,
          severity: c.severity,
          raised_by: c.raised_by,
        })),
      incidents: byId(incidents, s.site_id).map((i) => ({
        date: i.date,
        category: i.category,
        severity: i.severity,
        resolved_remotely: i.resolved_remotely === 1,
      })),
      phase_history: byId(transitions, s.site_id).map((t) => ({
        from_phase: t.from_phase,
        to_phase: t.to_phase,
        date: t.transition_date,
        days_in_previous_phase: t.days_in_previous_phase,
      })),
    })),
  };
}

export type AgentContext = ReturnType<typeof getAgentContext>;
