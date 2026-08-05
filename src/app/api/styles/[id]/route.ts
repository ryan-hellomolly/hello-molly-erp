import { NextResponse } from "next/server";
import { requireSystemAdmin } from "@/server/auth/authorization";
import { isTrustedOrigin } from "@/server/auth/security";
import {
  getStyle,
  setStyleStatus,
  styleStatusSchema,
  updateStyle,
  updateStyleSchema,
} from "@/server/styles/service";

export async function GET(_request: Request, context: RouteContext<"/api/styles/[id]">) {
  if (!(await requireSystemAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  const style = await getStyle(id);
  return style
    ? NextResponse.json(style)
    : NextResponse.json({ error: "STYLE_NOT_FOUND" }, { status: 404 });
}

export async function PATCH(request: Request, context: RouteContext<"/api/styles/[id]">) {
  if (!isTrustedOrigin(request.headers.get("origin"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const user = await requireSystemAdmin();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const status = styleStatusSchema.safeParse(body);
  const update = updateStyleSchema.safeParse(body);
  const result = status.success
    ? await setStyleStatus(id, status.data.status, user.id)
    : update.success
      ? await updateStyle(id, update.data, user.id)
      : null;
  if (!result) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }
  return NextResponse.json(result, {
    status: result.ok
      ? 200
      : result.error === "STYLE_NOT_FOUND"
        ? 404
        : result.error === "INVALID_STYLE_TRANSITION"
          ? 409
          : 400,
  });
}
