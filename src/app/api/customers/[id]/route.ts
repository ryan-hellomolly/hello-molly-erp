import { NextResponse } from "next/server";
import { requireSystemAdmin } from "@/server/auth/authorization";
import { isTrustedOrigin } from "@/server/auth/security";
import {
  customerStatusSchema,
  getCustomer,
  setCustomerStatus,
  updateCustomer,
  updateCustomerSchema,
} from "@/server/customers/service";

export async function GET(_request: Request, context: RouteContext<"/api/customers/[id]">) {
  const user = await requireSystemAdmin();
  if (!user) {return NextResponse.json({ error: "Forbidden" }, { status: 403 });}
  const { id } = await context.params;
  const customer = await getCustomer(id);
  return customer
    ? NextResponse.json(customer)
    : NextResponse.json({ error: "CUSTOMER_NOT_FOUND" }, { status: 404 });
}

export async function PATCH(request: Request, context: RouteContext<"/api/customers/[id]">) {
  if (!isTrustedOrigin(request.headers.get("origin"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const user = await requireSystemAdmin();
  if (!user) {return NextResponse.json({ error: "Forbidden" }, { status: 403 });}
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const statusInput = customerStatusSchema.safeParse(body);
  const updateInput = updateCustomerSchema.safeParse(body);
  const result = statusInput.success
    ? await setCustomerStatus(id, statusInput.data.status, user.id)
    : updateInput.success
      ? await updateCustomer(id, updateInput.data, user.id)
      : null;
  if (!result) {return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });}
  if (!result.ok) {
    return NextResponse.json(result, {
      status: result.error === "CUSTOMER_NOT_FOUND" ? 404 : 409,
    });
  }
  return NextResponse.json(result);
}
