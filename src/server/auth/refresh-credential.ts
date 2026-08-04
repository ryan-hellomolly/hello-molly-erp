import "server-only";
import { db } from "@/server/db";
import { env } from "@/server/env";
import { createRefreshToken, hashRefreshToken } from "./tokens";

export async function rotateRefreshCredential(sessionId: string, supplied: string) {
  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });
  if (
    !session ||
    session.revokedAt ||
    session.expiresAt <= new Date() ||
    session.user.status !== "ACTIVE" ||
    session.refreshTokenHash !== hashRefreshToken(supplied)
  ) {
    if (session && !session.revokedAt) {
      await db.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    }
    return null;
  }
  const refreshToken = createRefreshToken();
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000);
  await db.session.update({
    where: { id: session.id },
    data: { refreshTokenHash: hashRefreshToken(refreshToken), rotatedAt: new Date(), expiresAt },
  });
  return {
    sessionId,
    userId: session.userId,
    tokenVersion: session.user.tokenVersion,
    refreshToken,
    expiresAt,
  };
}
