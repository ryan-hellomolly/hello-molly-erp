import { Queue } from "bullmq";
import { redis } from "@/server/redis";

export const systemQueue = new Queue("system", { connection: redis });
