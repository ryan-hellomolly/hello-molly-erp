import { NextResponse } from "next/server";
import { requireSystemAdmin } from "@/server/auth/authorization";
import { authService } from "@/server/auth/auth-service";
import { isTrustedOrigin } from "@/server/auth/security";
import {
  deliveryAddressSchema,
  listDeliveryAddresses,
  saveDeliveryAddress,
} from "@/server/foundation-records/service";
export async function GET() {
  if (!(await authService.currentUser()))
    {return NextResponse.json({ error: "Unauthorized" }, { status: 401 });}
  return NextResponse.json({ data: await listDeliveryAddresses() });
}
export async function POST(request: Request) {
  if (!isTrustedOrigin(request.headers.get("origin")))
    {return NextResponse.json({ error: "Forbidden" }, { status: 403 });}
  const user = await requireSystemAdmin();
  if (!user) {return NextResponse.json({ error: "Forbidden" }, { status: 403 });}
  const parsed = deliveryAddressSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });}
  return NextResponse.json(
    { ok: true, data: await saveDeliveryAddress(null, parsed.data, user.id) },
    { status: 201 },
  );
}
