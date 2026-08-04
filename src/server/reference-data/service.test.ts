import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import {
  createReferenceValue,
  listReferenceValues,
  referenceInputSchema,
  setReferenceStatus,
  updateReferenceValue,
} from "./service";
const marker = `R${Date.now()}`;
afterAll(async () => {
  const rows = await db.referenceValue.findMany({
    where: { code: { startsWith: marker } },
    select: { id: true },
  });
  const ids = rows.map(({ id }) => id);
  await db.auditEvent.deleteMany({
    where: { entityType: "ReferenceValue", entityId: { in: ids } },
  });
  await db.referenceValue.deleteMany({ where: { id: { in: ids } } });
  await db.$disconnect();
});
describe("reference data", () => {
  it("validates currency and unit rules", () => {
    expect(
      referenceInputSchema.safeParse({
        type: "CURRENCY",
        code: "AU",
        nameEn: "Dollar",
        nameZh: "澳元",
      }).success,
    ).toBe(false);
    expect(
      referenceInputSchema.safeParse({ type: "UNIT", code: "M", nameEn: "Metre", nameZh: "米" })
        .success,
    ).toBe(false);
  });
  it("creates, sorts and rejects duplicate sizes", async () => {
    const actor = await db.user.findFirstOrThrow();
    await createReferenceValue(
      { type: "SIZE", code: `${marker}L`, nameEn: "Large", nameZh: "大", sortOrder: 20 },
      actor.id,
    );
    await createReferenceValue(
      { type: "SIZE", code: `${marker}S`, nameEn: "Small", nameZh: "小", sortOrder: 10 },
      actor.id,
    );
    const rows = (await listReferenceValues("SIZE")).filter(({ code }) => code.startsWith(marker));
    expect(rows.map(({ sortOrder }) => sortOrder)).toEqual([10, 20]);
    expect(
      await createReferenceValue(
        { type: "SIZE", code: `${marker}S`, nameEn: "Duplicate", nameZh: "重复" },
        actor.id,
      ),
    ).toMatchObject({ ok: false, error: "DUPLICATE_REFERENCE" });
  });
  it("deactivates values", async () => {
    const actor = await db.user.findFirstOrThrow();
    const row = await db.referenceValue.findFirstOrThrow({ where: { code: `${marker}L` } });
    expect(await setReferenceStatus(row.id, false, actor.id)).toMatchObject({
      ok: true,
      value: { active: false },
    });
    expect(await setReferenceStatus(crypto.randomUUID(), false, actor.id)).toMatchObject({
      ok: false,
      error: "REFERENCE_NOT_FOUND",
    });
  });
  it("updates values and rejects a duplicate code", async () => {
    const actor = await db.user.findFirstOrThrow();
    const row = await db.referenceValue.findFirstOrThrow({ where: { code: `${marker}L` } });
    expect(
      await updateReferenceValue(
        row.id,
        { type: "SIZE", code: `${marker}XL`, nameEn: "Extra Large", nameZh: "加大", sortOrder: 30 },
        actor.id,
      ),
    ).toMatchObject({ ok: true, value: { code: `${marker}XL`, sortOrder: 30 } });
    expect(
      await updateReferenceValue(
        row.id,
        { type: "SIZE", code: `${marker}S`, nameEn: "Duplicate", nameZh: "重复" },
        actor.id,
      ),
    ).toMatchObject({ ok: false, error: "DUPLICATE_REFERENCE" });
  });
});
