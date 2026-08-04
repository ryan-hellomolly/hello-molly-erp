import { NextResponse } from "next/server";
import { requireSystemAdmin } from "@/server/auth/authorization";
import { isTrustedOrigin } from "@/server/auth/security";
import {
  referenceStatusSchema,
  referenceUpdateSchema,
  setReferenceStatus,
  updateReferenceValue,
} from "@/server/reference-data/service";
export async function PATCH(request: Request, context: RouteContext<"/api/reference-data/[id]">) {
  if (!isTrustedOrigin(request.headers.get("origin"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const user = await requireSystemAdmin();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const { id } = await context.params;
  const status = referenceStatusSchema.safeParse(body);
  if (status.success) {
    const result = await setReferenceStatus(id, status.data.active, user.id);
    return NextResponse.json(result, { status: result.ok ? 200 : 404 });
  }
  const update = referenceUpdateSchema.safeParse(body);
  if (!update.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", issues: update.error.flatten() },
      { status: 400 },
    );
  }
  const result = await updateReferenceValue(id, update.data, user.id);
  return NextResponse.json(result, {
    status: result.ok ? 200 : result.error === "DUPLICATE_REFERENCE" ? 409 : 404,
  });
}

export async function DELETE(request: Request, context: RouteContext<"/api/reference-data/[id]">) {
  if (!isTrustedOrigin(request.headers.get("origin"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const user = await requireSystemAdmin();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  const result = await setReferenceStatus(id, false, user.id);
  return NextResponse.json(result, { status: result.ok ? 200 : 404 });
}
