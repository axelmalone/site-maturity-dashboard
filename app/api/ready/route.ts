import { NextResponse } from "next/server";
import { getProgressionReadiness } from "@/lib/queries";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getProgressionReadiness());
}
