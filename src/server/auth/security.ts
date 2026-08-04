import "server-only";
import { headers } from "next/headers";
import { env } from "@/server/env";
import { redis } from "@/server/redis";
import { matchesOrigin } from "./origin";

export function isTrustedOrigin(origin: string | null) {
  return matchesOrigin(origin, env.APP_URL, env.NODE_ENV !== "production");
}
export async function assertTrustedOrigin() {
  const origin = (await headers()).get("origin");
  if (!isTrustedOrigin(origin)) {
    throw new Error("Untrusted request origin");
  }
}
export async function requestIdentity() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}
export async function consumeRateLimit(
  scope: string,
  identity: string,
  limit: number,
  windowSeconds: number,
) {
  if (redis.status === "wait") {
    await redis.connect();
  }
  const key = `rate:${scope}:${identity}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }
  return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
}
