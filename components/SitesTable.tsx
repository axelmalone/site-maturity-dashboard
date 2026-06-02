"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { phaseBadgeVariant, formatPercent } from "@/lib/format";
import type { SiteSummary } from "@/lib/queries";

type SortKey =
  | "site_name"
  | "customer_name"
  | "area"
  | "current_phase"
  | "daysInCurrentPhase"
  | "avgAutonomy"
  | "openBlockers";

const COLUMNS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: "site_name", label: "Site" },
  { key: "customer_name", label: "Customer" },
  { key: "area", label: "Area" },
  { key: "current_phase", label: "Phase", numeric: true },
  { key: "daysInCurrentPhase", label: "Days in phase", numeric: true },
  { key: "avgAutonomy", label: "Avg autonomy", numeric: true },
  { key: "openBlockers", label: "Blockers", numeric: true },
];

export function SitesTable({ sites }: { sites: SiteSummary[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("current_phase");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function toggle(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = [...sites].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    let cmp: number;
    if (typeof av === "number" && typeof bv === "number") {
      cmp = av - bv;
    } else {
      cmp = String(av).localeCompare(String(bv));
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {COLUMNS.map((col) => (
            <TableHead
              key={col.key}
              className={cn("cursor-pointer select-none", col.numeric && "text-right")}
              onClick={() => toggle(col.key)}
            >
              <span
                className={cn(
                  "inline-flex items-center gap-1",
                  col.numeric && "flex-row-reverse"
                )}
              >
                {col.label}
                {sortKey === col.key ? (
                  sortDir === "asc" ? (
                    <ArrowUp className="size-3.5" />
                  ) : (
                    <ArrowDown className="size-3.5" />
                  )
                ) : (
                  <ChevronsUpDown className="size-3.5 opacity-40" />
                )}
              </span>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((site) => (
          <TableRow key={site.site_id}>
            <TableCell className="font-medium">
              <Link
                href={`/sites/${site.site_id}`}
                className="hover:underline"
              >
                {site.site_name}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {site.customer_name}
            </TableCell>
            <TableCell className="text-muted-foreground">{site.area}</TableCell>
            <TableCell className="text-right">
              <Badge variant={phaseBadgeVariant(site.current_phase)}>
                {site.current_phase}
              </Badge>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {site.daysInCurrentPhase}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatPercent(site.avgAutonomy)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {site.openBlockers}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
