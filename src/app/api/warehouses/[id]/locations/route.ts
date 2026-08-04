import { NextResponse } from "next/server";
import { requireSystemAdmin } from "@/server/auth/authorization";
import { isTrustedOrigin } from "@/server/auth/security";
import { addWarehouseLocation, locationSchema } from "@/server/warehouses/service";
export async function POST(
  request: Request,
  context: RouteContext<"/api/warehouses/[id]/locations">,
) {
  if (!isTrustedOrigin(request.headers.get("origin")))
    {return NextResponse.json({ error: "Forbidden" }, { status: 403 });}
  const user = await requireSystemAdmin();
  if (!user) {return NextResponse.json({ error: "Forbidden" }, { status: 403 });}
  const parsed = locationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    {return NextResponse.json(
      { error: "VALIDATION_ERROR", issues: parsed.error.flatten() },
      { status: 400 },
    );}
  const { id } = await context.params;
  const result = await addWarehouseLocation(id, parsed.data, user.id);
  return NextResponse.json(result, {
    status: result.ok ? 201 : result.error === "WAREHOUSE_NOT_FOUND" ? 404 : 409,
  });
}
