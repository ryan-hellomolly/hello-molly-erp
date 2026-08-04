import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
  process.env.JWT_SECRET ??= "test-secret-that-is-at-least-32-characters-long";
});

describe("authentication tokens", () => {
  it("signs and verifies access-token claims", async () => {
    const { signAccessToken, verifyAccessToken } = await import("./tokens");
    const claims = { sub: "user-1", sessionId: "session-1", tokenVersion: 2 };
    const token = await signAccessToken(claims);
    await expect(verifyAccessToken(token)).resolves.toEqual(claims);
  });

  it("creates non-reversible refresh-token hashes", async () => {
    const { createRefreshToken, hashRefreshToken } = await import("./tokens");
    const token = createRefreshToken();
    expect(token.length).toBeGreaterThan(40);
    expect(hashRefreshToken(token)).not.toContain(token);
    expect(hashRefreshToken(token)).toHaveLength(64);
  });

  it("rejects expired access tokens", async () => {
    const { SignJWT } = await import("jose");
    const { verifyAccessToken } = await import("./tokens");
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const token = await new SignJWT({ sid: "session-1", ver: 1 })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user-1")
      .setExpirationTime("0s")
      .sign(secret);
    await expect(verifyAccessToken(token)).rejects.toThrow();
  });
});
