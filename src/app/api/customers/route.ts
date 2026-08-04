import { NextResponse } from "next/server";
import { createCustomer, createCustomerSchema, listCustomers } from "@/server/customers/service";
import { authService } from "@/server/auth/auth-service";
import { requireSystemAdmin } from "@/server/auth/authorization";
import { isTrustedOrigin } from "@/server/auth/security";
export async function GET(request: Request) {
  if (!(await authService.currentUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const q = new URL(request.url).searchParams;
  return NextResponse.json(
    await listCustomers({
      page: Number(q.get("page") || 1),
      pageSize: Number(q.get("pageSize") || 20),
      search: q.get("search") || "",
    }),
  );
}
export async function POST(request: Request) {
  if (!isTrustedOrigin(request.headers.get("origin"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!(await requireSystemAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = createCustomerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const result = await createCustomer(parsed.data);
  return NextResponse.json(result, { status: result.ok ? 201 : 409 });
}
