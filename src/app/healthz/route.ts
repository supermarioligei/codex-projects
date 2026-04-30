import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "studio-admin",
    timestamp: new Date().toISOString(),
  });
}
