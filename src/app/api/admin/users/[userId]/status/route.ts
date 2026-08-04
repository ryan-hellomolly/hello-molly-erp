import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSystemAdmin } from "@/server/auth/authorization";
import { isTrustedOrigin } from "@/server/auth/security";
import { db } from "@/server/db";
export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  if (!isTrustedOrigin(request.headers.get("origin"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const actor = await requireSystemAdmin();
  if (!actor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = z
    .object({ status: z.enum(["ACTIVE", "DISABLED", "LOCKED"]) })
    .safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const { userId } = await params;
  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { status: body.data.status, tokenVersion: { increment: 1 } },
    }),
    db.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    db.auditEvent.create({
      data: {
        actorId: actor.id,
        action: "AUTH_USER_STATUS_CHANGED",
        entityType: "User",
        entityId: userId,
        metadata: { status: body.data.status },
      },
    }),
  ]);
  return NextResponse.json({ updated: true });
}
