import { beforeAll, describe, expect, it } from "vitest";
beforeAll(() => {
  process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
  process.env.JWT_SECRET ??= "test-secret-that-is-at-least-32-characters-long";
  process.env.APP_URL = "http://localhost:3000";
});
describe("request origin protection", () => {
  it("accepts the configured application origin", async () => {
    const { matchesOrigin } = await import("./origin");
    expect(matchesOrigin("http://localhost:3000", "http://localhost:3000", false)).toBe(true);
  });
  it("rejects cross-site and malformed origins", async () => {
    const { matchesOrigin } = await import("./origin");
    expect(matchesOrigin("https://evil.example", "http://localhost:3000", false)).toBe(false);
    expect(matchesOrigin("invalid", "http://localhost:3000", false)).toBe(false);
  });
});
