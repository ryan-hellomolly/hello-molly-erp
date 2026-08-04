import IORedis from "ioredis";
import { env } from "@/server/env";

const globalForRedis = globalThis as unknown as { redis?: IORedis };

export const redis =
  globalForRedis.redis ??
  new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null, lazyConnect: true });

if (env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
