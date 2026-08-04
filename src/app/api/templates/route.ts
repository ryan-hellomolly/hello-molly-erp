import { NextResponse } from "next/server";
import { authService } from "@/server/auth/auth-service";
import { requireSystemAdmin } from "@/server/auth/authorization";
import { isTrustedOrigin } from "@/server/auth/security";
import { createTemplate, listTemplates, templateInputSchema } from "@/server/templates/service";
export async function GET() {
  if (!(await authService.currentUser()))
    {return NextResponse.json({ error: "Unauthorized" }, { status: 401 });}
  return NextResponse.json({ data: await listTemplates() });
}
export async function POST(request: Request) {
  if (!isTrustedOrigin(request.headers.get("origin")))
    {return NextResponse.json({ error: "Forbidden" }, { status: 403 });}
  const user = await requireSystemAdmin();
  if (!user) {return NextResponse.json({ error: "Forbidden" }, { status: 403 });}
  const parsed = templateInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    {return NextResponse.json(
      { error: "VALIDATION_ERROR", issues: parsed.error.flatten() },
      { status: 400 },
    );}
  const result = await createTemplate(parsed.data, user.id);
  return NextResponse.json(result, { status: result.ok ? 201 : 409 });
}
