import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { redis } from "@/server/redis";

export async function GET() {
  const startedAt = Date.now();

  try {
    if (redis.status === "wait") {
      await redis.connect();
    }
    await Promise.all([db.$queryRaw`SELECT 1`, redis.ping()]);

    return NextResponse.json({
      status: "ok",
      services: { database: "ok", redis: "ok" },
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed", error);
    return NextResponse.json(
      { status: "degraded", services: { database: "error", redis: "error" } },
      { status: 503 },
    );
  }
}
