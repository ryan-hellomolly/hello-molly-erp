import "server-only";
import argon2 from "argon2";
import { createRefreshToken, hashRefreshToken } from "./tokens";
import { passwordSchema } from "./password-policy";
import { db } from "@/server/db";

export async function issuePasswordReset(email: string) {
  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || user.status !== "ACTIVE") return null;
  await db.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });
  const token = createRefreshToken();
  await db.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashRefreshToken(token), expiresAt: new Date(Date.now() + 30 * 60_000) } });
  return token;
}

export async function resetPassword(token: string, password: string) {
  const parsed = passwordSchema.safeParse(password); if (!parsed.success) return { ok: false, error: "Password policy failed" } as const;
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash: hashRefreshToken(token) } });
  if (!record || record.usedAt || record.expiresAt <= new Date()) return { ok: false, error: "Invalid or expired token" } as const;
  await db.$transaction([
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    db.user.update({ where: { id: record.userId }, data: { passwordHash: await argon2.hash(password, { type: argon2.argon2id }), tokenVersion: { increment: 1 } } }),
    db.session.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    db.auditEvent.create({ data: { action: "AUTH_PASSWORD_RESET", entityType: "User", entityId: record.userId } }),
  ]);
  return { ok: true } as const;
}
