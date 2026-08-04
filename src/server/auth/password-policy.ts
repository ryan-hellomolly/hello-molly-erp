import { z } from "zod";
export const passwordSchema = z.string().min(12).max(128)
  .regex(/[a-z]/, "Lowercase letter required")
  .regex(/[A-Z]/, "Uppercase letter required")
  .regex(/[0-9]/, "Number required")
  .regex(/[^A-Za-z0-9]/, "Special character required");
