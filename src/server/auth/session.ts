import "server-only";
import argon2 from "argon2";
import { cookies } from "next/headers";
import { db } from "@/server/db";
import { env } from "@/server/env";
import { createRefreshToken, hashRefreshToken, signAccessToken, verifyAccessToken } from "./tokens";
import { rotateRefreshCredential } from "./refresh-credential";
const ACCESS = "hm_erp_access";
const REFRESH = "hm_erp_refresh";
const options = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
export async function authenticate(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  return user?.status === "ACTIVE" && (await argon2.verify(user.passwordHash, password))
    ? user
    : null;
}
export async function createUserSession(userId: string, tokenVersion: number) {
  const refresh = createRefreshToken();
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000);
  const session = await db.session.create({
    data: { userId, refreshTokenHash: hashRefreshToken(refresh), expiresAt },
  });
  const store = await cookies();
  store.set(ACCESS, await signAccessToken({ sub: userId, sessionId: session.id, tokenVersion }), {
    ...options,
    maxAge: env.ACCESS_TOKEN_TTL_SECONDS,
  });
  store.set(REFRESH, `${session.id}.${refresh}`, { ...options, expires: expiresAt });
  await db.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
}
export async function getCurrentUser() {
  const token = (await cookies()).get(ACCESS)?.value;
  if (!token) {
    return null;
  }
  try {
    const claims = await verifyAccessToken(token);
    const session = await db.session.findFirst({
      where: {
        id: claims.sessionId,
        userId: claims.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: { include: { userRoles: { include: { role: true } } } } },
    });
    if (
      !session ||
      session.user.status !== "ACTIVE" ||
      session.user.tokenVersion !== claims.tokenVersion
    ) {
      return null;
    }
    return {
      id: session.user.id,
      email: session.user.email,
      displayName: session.user.displayName,
      locale: session.user.locale,
      roles: session.user.userRoles.map(({ role }) => role.code),
    };
  } catch {
    return null;
  }
}
export async function revokeCurrentSession() {
  const store = await cookies();
  const token = store.get(ACCESS)?.value;
  if (token) {
    try {
      const claims = await verifyAccessToken(token);
      await db.session.updateMany({
        where: { id: claims.sessionId },
        data: { revokedAt: new Date() },
      });
    } catch {
      /* clear below */
    }
  }
  store.delete(ACCESS);
  store.delete(REFRESH);
}
export async function rotateCurrentSession() {
  const store = await cookies();
  const value = store.get(REFRESH)?.value;
  const separator = value?.indexOf(".") ?? -1;
  if (!value || separator < 1) {
    return false;
  }
  const sessionId = value.slice(0, separator);
  const supplied = value.slice(separator + 1);
  const rotated = await rotateRefreshCredential(sessionId, supplied);
  if (!rotated) {
    store.delete(ACCESS);
    store.delete(REFRESH);
    return false;
  }
  store.set(
    ACCESS,
    await signAccessToken({
      sub: rotated.userId,
      sessionId,
      tokenVersion: rotated.tokenVersion,
    }),
    { ...options, maxAge: env.ACCESS_TOKEN_TTL_SECONDS },
  );
  store.set(REFRESH, `${sessionId}.${rotated.refreshToken}`, {
    ...options,
    expires: rotated.expiresAt,
  });
  return true;
}
