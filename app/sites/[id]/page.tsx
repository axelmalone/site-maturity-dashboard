import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, X } from "lucide-react";

import { getSiteDetail } from "@/lib/queries";
import { PHASE_NAMES, PHASE_COVERAGE } from "@/lib/phases";
import {
  phaseBadgeVariant,
  severityVariant,
  formatPercent,
  titleCase,
} from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = getSiteDetail(Number(id));
  if (!detail) notFound();

  const { site, robots, recentIncidents, openConcerns, blockers, transitions } =
    detail;
  const r = site.readiness;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12">
      <div>
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" /> All sites
        </Link>
      </div>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{site.site_name}</h1>
          <Badge variant={phaseBadgeVariant(site.current_phase)}>
            Phase {site.current_phase} — {PHASE_NAMES[site.current_phase]}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          {site.customer_name} · {site.store_format} · {site.area}, {site.city}.
          Deployed{" "}
          <span className="font-mono">{site.deployment_date}</span> ·{" "}
          {site.daysOperating} days operating · {site.daysInCurrentPhase} days in
          current phase · avg autonomy {formatPercent(site.avgAutonomy)}.
        </p>
        <p className="text-muted-foreground text-sm">
          Coverage: {PHASE_COVERAGE[site.current_phase]}
        </p>
      </header>

      {/* Progression readiness */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Progression readiness</h2>
        {r.nextPhase === null ? (
          <Card>
            <CardContent className="text-muted-foreground text-sm">
              Already at Phase 4 (Autonomous). No further progression.
            </CardContent>
          </Card>
        ) : (
          <Card className={r.ready ? "border-emerald-500" : undefined}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>
                  Phase {site.current_phase} → Phase {r.nextPhase} (
                  {PHASE_NAMES[r.nextPhase]})
                </span>
                <Badge variant={r.ready ? "success" : "secondary"}>
                  {r.metCount}/{r.total} met
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2">
                {r.criteria.map((c) => (
                  <li
                    key={c.label}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      {c.met ? (
                        <Check className="size-4 text-emerald-600" />
                      ) : (
                        <X className="size-4 text-red-500" />
                      )}
                      {c.label}
                    </span>
                    <span className="tabular-nums">
                      {c.current} / {c.required}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Blockers (stored annotations) */}
      {blockers.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Phase blockers</h2>
          <div className="flex flex-col gap-2">
            {blockers.map((b) => (
              <Card key={b.blocker_id}>
                <CardContent className="flex flex-col gap-1">
                  <p className="text-sm font-medium">{b.blocker_description}</p>
                  <p className="text-muted-foreground text-xs">
                    {titleCase(b.target_metric)}: now {b.current_value}, need{" "}
                    {b.required_value}
                    {b.estimated_resolution_date
                      ? ` · est. resolution ${b.estimated_resolution_date}`
                      : ""}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Robots */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Robots</h2>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Robot</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Autonomy</TableHead>
                <TableHead>Deployed</TableHead>
                <TableHead>Last incident</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {robots.map((robot) => (
                <TableRow key={robot.robot_id}>
                  <TableCell className="font-medium">
                    R{robot.robot_id}
                  </TableCell>
                  <TableCell>{robot.model}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        robot.status === "operational"
                          ? "success"
                          : robot.status === "maintenance"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {robot.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPercent(robot.autonomy_score)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {robot.deployment_date}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {robot.last_incident_date ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Recent incidents */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Incidents (last 30 days)</h2>
        {recentIncidents.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No incidents in the last 30 days.
          </p>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Human intervention</TableHead>
                  <TableHead>Resolved remotely</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentIncidents.map((inc) => (
                  <TableRow key={inc.incident_id}>
                    <TableCell className="font-mono text-xs">
                      {inc.date}
                    </TableCell>
                    <TableCell>{inc.category}</TableCell>
                    <TableCell>
                      <Badge variant={severityVariant(inc.severity)}>
                        {inc.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {inc.required_human_intervention ? "Yes" : "No"}
                    </TableCell>
                    <TableCell>{inc.resolved_remotely ? "Yes" : "No"}</TableCell>
                    <TableCell>{inc.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* Open customer concerns */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Open customer concerns</h2>
        {openConcerns.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No open customer concerns.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {openConcerns.map((c) => (
              <Card key={c.concern_id}>
                <CardContent className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{c.description}</span>
                    <Badge variant={severityVariant(c.severity)}>
                      {c.severity}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Raised {c.raised_date} by {titleCase(c.raised_by)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Phase history */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Phase history</h2>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Transition</TableHead>
                <TableHead className="text-right">
                  Days in previous phase
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transitions.map((t) => (
                <TableRow key={t.transition_id}>
                  <TableCell className="font-mono text-xs">
                    {t.transition_date}
                  </TableCell>
                  <TableCell>
                    {t.from_phase
                      ? `Phase ${t.from_phase} → Phase ${t.to_phase}`
                      : `Initial deployment → Phase ${t.to_phase}`}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {t.days_in_previous_phase ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </main>
  );
}
