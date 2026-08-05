import { NextResponse } from "next/server";
import { requireSystemAdmin } from "@/server/auth/authorization";
import { getStyle, listStyleAuditEvents } from "@/server/styles/service";

export async function GET(_request: Request, context: RouteContext<"/api/styles/[id]/audit">) {
  if (!(await requireSystemAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  if (!(await getStyle(id))) {
    return NextResponse.json({ error: "STYLE_NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ data: await listStyleAuditEvents(id) });
}
