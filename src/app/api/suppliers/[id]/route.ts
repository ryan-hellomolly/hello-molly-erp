import { NextResponse } from "next/server";
import { requireSystemAdmin } from "@/server/auth/authorization";
import { isTrustedOrigin } from "@/server/auth/security";
import { setSupplierStatus, supplierStatusSchema, updateSupplier, updateSupplierSchema } from "@/server/suppliers/service";

export async function PATCH(request: Request, context: RouteContext<"/api/suppliers/[id]">) {
  if (!isTrustedOrigin(request.headers.get("origin"))) {return NextResponse.json({ error: "Forbidden" }, { status: 403 });}
  const user = await requireSystemAdmin();
  if (!user) {return NextResponse.json({ error: "Forbidden" }, { status: 403 });}
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const status = supplierStatusSchema.safeParse(body);
  const update = updateSupplierSchema.safeParse(body);
  const result = status.success ? await setSupplierStatus(id, status.data.status, user.id) : update.success ? await updateSupplier(id, update.data, user.id) : null;
  if (!result) {return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });}
  return NextResponse.json(result, { status: result.ok ? 200 : result.error === "SUPPLIER_NOT_FOUND" ? 404 : 409 });
}
