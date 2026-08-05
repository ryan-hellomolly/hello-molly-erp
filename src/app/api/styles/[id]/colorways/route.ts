import { NextResponse } from "next/server";
import { requireSystemAdmin } from "@/server/auth/authorization";
import { isTrustedOrigin } from "@/server/auth/security";
import { addStyleColorway, colorwaySchema } from "@/server/styles/service";

export async function POST(request: Request, context: RouteContext<"/api/styles/[id]/colorways">) {
  if (!isTrustedOrigin(request.headers.get("origin"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const user = await requireSystemAdmin();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = colorwaySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { id } = await context.params;
  const result = await addStyleColorway(id, parsed.data, user.id);
  return NextResponse.json(result, {
    status: result.ok
      ? 201
      : result.error === "STYLE_NOT_FOUND"
        ? 404
        : result.error === "DUPLICATE_COLORWAY"
          ? 409
          : 400,
  });
}
