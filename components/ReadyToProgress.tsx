import Link from "next/link";
import { Check, X } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PHASE_NAMES } from "@/lib/phases";
import type { SiteSummary } from "@/lib/queries";

export function ReadyToProgress({ sites }: { sites: SiteSummary[] }) {
  const readyCount = sites.filter((s) => s.readiness.ready).length;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        {readyCount > 0 ? (
          <>
            <span className="text-foreground font-semibold">{readyCount}</span>{" "}
            {readyCount === 1 ? "site is" : "sites are"} over the line and ready
            to progress now. The rest are ranked by how close they are.
          </>
        ) : (
          <>
            No site is over the line right now. Sites are ranked by how close
            they are to their next phase, closest first.
          </>
        )}
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        {sites.map((site) => {
          const r = site.readiness;
          return (
            <Card key={site.site_id} className={cn(r.ready && "border-emerald-500")}>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/sites/${site.site_id}`}
                    className="font-medium hover:underline"
                  >
                    {site.site_name}
                  </Link>
                  <Badge variant={r.ready ? "success" : "secondary"}>
                    {r.metCount}/{r.total} met
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs">
                  Phase {site.current_phase} → Phase {r.nextPhase} (
                  {r.nextPhase ? PHASE_NAMES[r.nextPhase] : ""})
                </p>
                <ul className="flex flex-col gap-1.5">
                  {r.criteria.map((c) => (
                    <li
                      key={c.label}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="flex items-center gap-1.5">
                        {c.met ? (
                          <Check className="size-3.5 text-emerald-600" />
                        ) : (
                          <X className="size-3.5 text-red-500" />
                        )}
                        <span
                          className={cn(
                            !c.met && "text-foreground",
                            c.met && "text-muted-foreground"
                          )}
                        >
                          {c.label}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "tabular-nums",
                          c.met ? "text-muted-foreground" : "font-medium"
                        )}
                      >
                        {c.current} / {c.required}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
