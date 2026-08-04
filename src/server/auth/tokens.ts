import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { env } from "@/server/env";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export type AccessTokenClaims = {
  sub: string;
  sessionId: string;
  tokenVersion: number;
};

export async function signAccessToken(claims: AccessTokenClaims) {
  return new SignJWT({ sid: claims.sessionId, ver: claims.tokenVersion })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${env.ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(secret);
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
  if (!payload.sub || typeof payload.sid !== "string" || typeof payload.ver !== "number") {
    throw new Error("Invalid access token claims");
  }
  return { sub: payload.sub, sessionId: payload.sid, tokenVersion: payload.ver };
}

export function createRefreshToken() {
  return randomBytes(48).toString("base64url");
}

export function hashRefreshToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
