import { NextResponse } from "next/server";
import { authService } from "@/server/auth/auth-service";
import { requireSystemAdmin } from "@/server/auth/authorization";
import { isTrustedOrigin } from "@/server/auth/security";
import {
  createReferenceValue,
  listReferenceValues,
  referenceInputSchema,
} from "@/server/reference-data/service";
const types = [
  "SIZE",
  "UNIT",
  "CURRENCY",
  "TRADE_TERM",
  "SETTLEMENT_METHOD",
  "INVOICE_TYPE",
  "SAMPLE_TYPE",
  "EXPENSE_TYPE",
  "SALES_CHANNEL",
] as const;
export async function GET(request: Request) {
  if (!(await authService.currentUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const raw = new URL(request.url).searchParams.get("type");
  const type = types.find((x) => x === raw);
  return NextResponse.json({ data: await listReferenceValues(type) });
}
export async function POST(request: Request) {
  if (!isTrustedOrigin(request.headers.get("origin"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const user = await requireSystemAdmin();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = referenceInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const result = await createReferenceValue(parsed.data, user.id);
  return NextResponse.json(result, { status: result.ok ? 201 : 409 });
}
