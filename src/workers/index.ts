import { Worker } from "bullmq";
import { redis } from "@/server/redis";

const worker = new Worker(
  "system",
  async (job) => {
    console.info("Processing job", { id: job.id, name: job.name });
    return { processedAt: new Date().toISOString() };
  },
  { connection: redis },
);

worker.on("completed", (job) => console.info("Job completed", { id: job.id }));
worker.on("failed", (job, error) => console.error("Job failed", { id: job?.id, error }));

async function shutdown(signal: string) {
  console.info("Worker shutting down", { signal });
  await worker.close();
  await redis.quit();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
