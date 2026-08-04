import { NextResponse } from "next/server";
import { rotateCurrentSession } from "@/server/auth/session";
import { consumeRateLimit, isTrustedOrigin } from "@/server/auth/security";
export async function POST(request: Request) {
  if (!isTrustedOrigin(request.headers.get("origin"))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!(await consumeRateLimit("refresh", ip, 30, 900)).allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  const refreshed = await rotateCurrentSession();
  return NextResponse.json({ refreshed }, { status: refreshed ? 200 : 401 });
}
