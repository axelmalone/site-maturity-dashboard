import { NextResponse } from "next/server";
import { getAllBlockers } from "@/lib/queries";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getAllBlockers());
}
