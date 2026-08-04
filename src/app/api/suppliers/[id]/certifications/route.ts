import { NextResponse } from "next/server";
import { requireSystemAdmin } from "@/server/auth/authorization";
import { isTrustedOrigin } from "@/server/auth/security";
import { addSupplierCertification, certificationSchema } from "@/server/suppliers/service";

export async function POST(request: Request, context: RouteContext<"/api/suppliers/[id]/certifications">) {
  if (!isTrustedOrigin(request.headers.get("origin"))) {return NextResponse.json({ error: "Forbidden" }, { status: 403 });}
  const user = await requireSystemAdmin();
  if (!user) {return NextResponse.json({ error: "Forbidden" }, { status: 403 });}
  const parsed = certificationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {return NextResponse.json({ error: "VALIDATION_ERROR", issues: parsed.error.flatten() }, { status: 400 });}
  const { id } = await context.params;
  const result = await addSupplierCertification(id, parsed.data, user.id);
  return NextResponse.json(result, { status: result.ok ? 201 : result.error === "SUPPLIER_NOT_FOUND" ? 404 : 400 });
}
