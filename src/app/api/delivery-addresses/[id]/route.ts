import { NextResponse } from "next/server";
import { requireSystemAdmin } from "@/server/auth/authorization";
import { isTrustedOrigin } from "@/server/auth/security";
import {
  deleteDeliveryAddress,
  deliveryAddressSchema,
  saveDeliveryAddress,
} from "@/server/foundation-records/service";
async function user(request: Request) {
  return isTrustedOrigin(request.headers.get("origin")) ? requireSystemAdmin() : null;
}
export async function PATCH(
  request: Request,
  context: RouteContext<"/api/delivery-addresses/[id]">,
) {
  const actor = await user(request);
  if (!actor) {return NextResponse.json({ error: "Forbidden" }, { status: 403 });}
  const parsed = deliveryAddressSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });}
  const { id } = await context.params;
  return NextResponse.json({
    ok: true,
    data: await saveDeliveryAddress(id, parsed.data, actor.id),
  });
}
export async function DELETE(
  request: Request,
  context: RouteContext<"/api/delivery-addresses/[id]">,
) {
  const actor = await user(request);
  if (!actor) {return NextResponse.json({ error: "Forbidden" }, { status: 403 });}
  const { id } = await context.params;
  const ok = await deleteDeliveryAddress(id, actor.id);
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}
