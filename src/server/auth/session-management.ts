import "server-only";
import { db } from "@/server/db";
export async function revokeOwnedSession(userId: string, sessionId: string) {
  const result = await db.session.updateMany({
    where: { id: sessionId, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count === 1;
}
