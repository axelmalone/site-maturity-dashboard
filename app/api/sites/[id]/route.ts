import { NextResponse } from "next/server";
import { getSiteDetail } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const detail = getSiteDetail(Number(id));
  if (!detail) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }
  return NextResponse.json(detail);
}
