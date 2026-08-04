import { NextResponse } from "next/server";
import { requireSystemAdmin } from "@/server/auth/authorization";
import { isTrustedOrigin } from "@/server/auth/security";
import { colorwayStatusSchema, setStyleColorwayStatus } from "@/server/styles/service";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/styles/[id]/colorways/[colorwayId]">,
) {
  if (!isTrustedOrigin(request.headers.get("origin"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const user = await requireSystemAdmin();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = colorwayStatusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }
  const { id, colorwayId } = await context.params;
  const result = await setStyleColorwayStatus(id, colorwayId, parsed.data.status, user.id);
  return NextResponse.json(result, {
    status: result.ok ? 200 : result.error === "COLORWAY_NOT_FOUND" ? 404 : 409,
  });
}
