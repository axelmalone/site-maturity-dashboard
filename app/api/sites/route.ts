import { NextResponse } from "next/server";
import { getSiteSummaries } from "@/lib/queries";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getSiteSummaries());
}
