import { NextResponse } from "next/server";
import { authService } from "@/server/auth/auth-service";
import { requireSystemAdmin } from "@/server/auth/authorization";
import { isTrustedOrigin } from "@/server/auth/security";
import { createFactory, createFactorySchema, listFactories } from "@/server/factories/service";
export async function GET(request: Request) {
  if (!(await authService.currentUser()))
    {return NextResponse.json({ error: "Unauthorized" }, { status: 401 });}
  return NextResponse.json({
    data: await listFactories(new URL(request.url).searchParams.get("search") ?? ""),
  });
}
export async function POST(request: Request) {
  if (!isTrustedOrigin(request.headers.get("origin")) || !(await requireSystemAdmin()))
    {return NextResponse.json({ error: "Forbidden" }, { status: 403 });}
  const parsed = createFactorySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    {return NextResponse.json(
      { error: "VALIDATION_ERROR", issues: parsed.error.flatten() },
      { status: 400 },
    );}
  const result = await createFactory(parsed.data);
  return NextResponse.json(result, { status: result.ok ? 201 : 409 });
}
