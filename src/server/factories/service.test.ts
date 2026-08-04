import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import {
  createFactory,
  listFactories,
  listFactoryAuditEvents,
  normalizeCapabilities,
  normalizeFactoryName,
  setFactoryStatus,
  updateFactory,
} from "./service";
const marker = `F${Date.now()}`;
afterAll(async () => {
  const rows = await db.factory.findMany({
    where: { code: { startsWith: marker } },
    select: { id: true },
  });
  const ids = rows.map(({ id }) => id);
  await db.auditEvent.deleteMany({ where: { entityType: "Factory", entityId: { in: ids } } });
  await db.factory.deleteMany({ where: { id: { in: ids } } });
  await db.$disconnect();
});
describe("factory master", () => {
  it("normalizes names and capabilities", () => {
    expect(normalizeFactoryName(" Molly-Factory CN ")).toBe("molly factory cn");
    expect(normalizeCapabilities([" Knit ", "Woven", "Knit", ""])).toEqual(["Knit", "Woven"]);
  });
  it("creates, lists and rejects duplicate factories", async () => {
    expect(
      await createFactory({
        code: `${marker}A`,
        name: `${marker} Apparel`,
        countryCode: "cn",
        capabilities: ["Knit"],
      }),
    ).toMatchObject({ ok: true });
    expect(await listFactories(marker)).toHaveLength(1);
    expect(
      await createFactory({ code: `${marker}A`, name: "Other", countryCode: "AU" }),
    ).toMatchObject({ ok: false, error: "DUPLICATE_FACTORY" });
    expect(
      await createFactory({ code: `${marker}B`, name: `${marker}-Apparel`, countryCode: "CN" }),
    ).toMatchObject({ ok: false, error: "DUPLICATE_FACTORY" });
  });
  it("updates capabilities, status and audit history", async () => {
    const actor = await db.user.findFirstOrThrow();
    const factory = await db.factory.findFirstOrThrow({ where: { code: `${marker}A` } });
    expect(
      await updateFactory(
        factory.id,
        {
          name: `${marker} Apparel`,
          countryCode: "CN",
          city: "Guangzhou",
          capabilities: ["Woven", "Knit"],
        },
        actor.id,
      ),
    ).toMatchObject({ ok: true, factory: { capabilities: ["Knit", "Woven"] } });
    expect(await setFactoryStatus(factory.id, "ON_HOLD", actor.id)).toMatchObject({
      ok: true,
      factory: { status: "ON_HOLD" },
    });
    expect((await listFactoryAuditEvents(factory.id)).map(({ action }) => action)).toEqual([
      "FACTORY_ON_HOLD",
      "FACTORY_UPDATED",
    ]);
  });
  it("returns not found for unknown factories", async () => {
    const actor = await db.user.findFirstOrThrow();
    expect(await setFactoryStatus(crypto.randomUUID(), "INACTIVE", actor.id)).toMatchObject({
      ok: false,
      error: "FACTORY_NOT_FOUND",
    });
  });
});
