import { describe, expect, it, vi } from "vitest";
import { DefaultAuthService } from "./auth-service";

describe("AuthService boundary", () => {
  it("normalizes credential identifiers and creates a session from the returned identity", async () => {
    const identity = { id: "user-1", tokenVersion: 3 };
    const ports = {
      authenticate: vi.fn().mockResolvedValue(identity),
      createSession: vi.fn().mockResolvedValue(undefined),
      currentUser: vi.fn(),
      logout: vi.fn(),
    };
    const service = new DefaultAuthService(ports);
    await expect(
      service.authenticateWithPassword(" Admin@Example.COM ", "password"),
    ).resolves.toEqual(identity);
    expect(ports.authenticate).toHaveBeenCalledWith("admin@example.com", "password");
    await service.createSession(identity);
    expect(ports.createSession).toHaveBeenCalledWith("user-1", 3);
  });

  it("delegates current-user and logout operations without exposing persistence details", async () => {
    const user = {
      id: "u1",
      email: "u@example.test",
      displayName: "User",
      locale: "en-AU",
      roles: ["USER"],
    };
    const ports = {
      authenticate: vi.fn(),
      createSession: vi.fn(),
      currentUser: vi.fn().mockResolvedValue(user),
      logout: vi.fn().mockResolvedValue(undefined),
    };
    const service = new DefaultAuthService(ports);
    await expect(service.currentUser()).resolves.toEqual(user);
    await service.logout();
    expect(ports.logout).toHaveBeenCalledOnce();
  });
});
