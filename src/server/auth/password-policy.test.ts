import { describe, expect, it } from "vitest";
import { passwordSchema } from "./password-policy";
describe("password policy", () => {
  it("accepts a strong password", () =>
    expect(passwordSchema.safeParse("Valid!Password2026").success).toBe(true));
  it("rejects short and single-class passwords", () => {
    expect(passwordSchema.safeParse("Short1!").success).toBe(false);
    expect(passwordSchema.safeParse("alllowercasepassword").success).toBe(false);
  });
});
