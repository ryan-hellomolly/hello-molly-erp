import { NextResponse } from "next/server";
import { authService } from "@/server/auth/auth-service";
import { requireSystemAdmin } from "@/server/auth/authorization";
import { isTrustedOrigin } from "@/server/auth/security";
import { createStyle, createStyleSchema, listStyles } from "@/server/styles/service";

export async function GET(request: Request) {
  if (!(await authService.currentUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const q = new URL(request.url).searchParams;
  return NextResponse.json(
    await listStyles({
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
  const user = await requireSystemAdmin();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = createStyleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const result = await createStyle(parsed.data, user.id);
  return NextResponse.json(result, {
    status: result.ok ? 201 : result.error === "DUPLICATE_STYLE" ? 409 : 400,
  });
}
