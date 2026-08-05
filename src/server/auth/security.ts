import "server-only";
import { headers } from "next/headers";
import { env } from "@/server/env";
import { redis } from "@/server/redis";
import { matchesOrigin } from "./origin";

export function isTrustedOrigin(origin: string | null) {
  // Outside production, trust any origin so local dev can be reached interchangeably via
  // localhost and tunnels (e.g. ngrok) without editing APP_URL each time. Production always
  // enforces the strict same-origin match below.
  if (env.NODE_ENV !== "production") {
    return true;
  }
  return matchesOrigin(origin, env.APP_URL, false);
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
