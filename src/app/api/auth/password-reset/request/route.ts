import { NextResponse } from "next/server";
import { z } from "zod";
import { issuePasswordReset } from "@/server/auth/password-reset";
import { consumeRateLimit, isTrustedOrigin } from "@/server/auth/security";
import { env } from "@/server/env";
export async function POST(request: Request) {
  if (!isTrustedOrigin(request.headers.get("origin"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!(await consumeRateLimit("password-reset", ip, 5, 3600)).allowed) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }
  const parsed = z.object({ email: z.email() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const token = await issuePasswordReset(parsed.data.email);
  return NextResponse.json({
    accepted: true,
    ...(env.NODE_ENV === "development" && token ? { previewToken: token } : {}),
  });
}
