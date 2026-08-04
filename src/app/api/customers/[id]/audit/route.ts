import { NextResponse } from "next/server";
import { requireSystemAdmin } from "@/server/auth/authorization";
import { getCustomer, listCustomerAuditEvents } from "@/server/customers/service";

export async function GET(_request: Request, context: RouteContext<"/api/customers/[id]/audit">) {
  if (!(await requireSystemAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  if (!(await getCustomer(id))) {
    return NextResponse.json({ error: "CUSTOMER_NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ data: await listCustomerAuditEvents(id) });
}
