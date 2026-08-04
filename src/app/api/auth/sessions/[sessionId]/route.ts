import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { isTrustedOrigin } from "@/server/auth/security";
import { revokeOwnedSession } from "@/server/auth/session-management";
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  if (!isTrustedOrigin(request.headers.get("origin"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { sessionId } = await params;
  return NextResponse.json({ revoked: await revokeOwnedSession(user.id, sessionId) });
}
