// Presentation helpers — pure, safe to import in client components.

type BadgeVariant = "default" | "secondary" | "success" | "warning" | "danger";

export function phaseBadgeVariant(phase: number): BadgeVariant {
  switch (phase) {
    case 1:
      return "warning";
    case 2:
      return "secondary";
    case 3:
      return "default";
    case 4:
      return "success";
    default:
      return "secondary";
  }
}

export function severityVariant(severity: string): BadgeVariant {
  switch (severity) {
    case "critical":
    case "high":
      return "danger";
    case "major":
    case "medium":
      return "warning";
    default:
      return "secondary";
  }
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function titleCase(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
