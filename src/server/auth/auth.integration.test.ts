import argon2 from "argon2";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { replaceUserRoles } from "./access-management";
import { issuePasswordReset, resetPassword } from "./password-reset";
import { rotateRefreshCredential } from "./refresh-credential";
import { revokeOwnedSession } from "./session-management";
import { createRefreshToken, hashRefreshToken } from "./tokens";

const marker = `auth-test-${Date.now()}`;
let firstUserId: string;
let secondUserId: string;
let actorId: string;
let roleId: string;

beforeAll(async () => {
  const hash = await argon2.hash("Valid!Password2026", { type: argon2.argon2id });
  const [first, second, actor, role] = await Promise.all([
    db.user.create({
      data: { email: `${marker}-one@example.test`, displayName: "First", passwordHash: hash },
    }),
    db.user.create({
      data: { email: `${marker}-two@example.test`, displayName: "Second", passwordHash: hash },
    }),
    db.user.create({
      data: { email: `${marker}-admin@example.test`, displayName: "Admin", passwordHash: hash },
    }),
    db.role.create({ data: { code: marker, nameEn: marker, nameZh: marker } }),
  ]);
  firstUserId = first.id;
  secondUserId = second.id;
  actorId = actor.id;
  roleId = role.id;
});

afterAll(async () => {
  await db.auditEvent.deleteMany({
    where: { OR: [{ actorId }, { entityId: { in: [firstUserId, secondUserId, roleId] } }] },
  });
  await db.user.deleteMany({ where: { id: { in: [firstUserId, secondUserId, actorId] } } });
  await db.role.deleteMany({ where: { id: roleId } });
  await db.$disconnect();
});

describe("authentication database boundaries", () => {
  it("rotates refresh credentials and revokes the session on old-token replay", async () => {
    const original = createRefreshToken();
    const session = await db.session.create({
      data: {
        userId: firstUserId,
        refreshTokenHash: hashRefreshToken(original),
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    const rotated = await rotateRefreshCredential(session.id, original);
    expect(rotated?.refreshToken).toBeTruthy();
    expect(await rotateRefreshCredential(session.id, original)).toBeNull();
    expect(
      (await db.session.findUniqueOrThrow({ where: { id: session.id } })).revokedAt,
    ).not.toBeNull();
  });

  it("prevents one user from revoking another user's session", async () => {
    const token = createRefreshToken();
    const session = await db.session.create({
      data: {
        userId: firstUserId,
        refreshTokenHash: hashRefreshToken(token),
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    expect(await revokeOwnedSession(secondUserId, session.id)).toBe(false);
    expect(await revokeOwnedSession(firstUserId, session.id)).toBe(true);
  });

  it("revokes every session and rejects replay after password reset", async () => {
    const token = createRefreshToken();
    await db.session.create({
      data: {
        userId: secondUserId,
        refreshTokenHash: hashRefreshToken(token),
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    const reset = await issuePasswordReset(`${marker}-two@example.test`);
    expect(reset).toBeTruthy();
    await expect(resetPassword(reset!, "Another!Password2026")).resolves.toEqual({ ok: true });
    expect(await resetPassword(reset!, "Another!Password2026")).toEqual({
      ok: false,
      error: "Invalid or expired token",
    });
    expect(await db.session.count({ where: { userId: secondUserId, revokedAt: null } })).toBe(0);
  });

  it("invalidates sessions and increments auth version after role changes", async () => {
    const before = await db.user.findUniqueOrThrow({ where: { id: firstUserId } });
    const token = createRefreshToken();
    await db.session.create({
      data: {
        userId: firstUserId,
        refreshTokenHash: hashRefreshToken(token),
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    await replaceUserRoles(actorId, firstUserId, [roleId]);
    const after = await db.user.findUniqueOrThrow({ where: { id: firstUserId } });
    expect(after.tokenVersion).toBe(before.tokenVersion + 1);
    expect(await db.session.count({ where: { userId: firstUserId, revokedAt: null } })).toBe(0);
  });
});
