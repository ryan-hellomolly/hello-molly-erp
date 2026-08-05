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

  it("builds a style type hierarchy and protects it from orphaning", async () => {
    const actor = await db.user.findFirstOrThrow();
    const parent = await createReferenceValue(
      { type: "STYLE_TYPE", code: `${marker}TOP`, nameEn: "Tops", nameZh: "上衣" },
      actor.id,
    );
    if (!parent.ok) {
      throw new Error("expected parent style type create to succeed");
    }
    const child = await createReferenceValue(
      {
        type: "STYLE_TYPE",
        code: `${marker}TSHIRT`,
        nameEn: "T-Shirt",
        nameZh: "T恤",
        symbol: "T",
        parentId: parent.value.id,
      },
      actor.id,
    );
    expect(child).toMatchObject({ ok: true, value: { parentId: parent.value.id, symbol: "T" } });

    const otherType = await createReferenceValue(
      { type: "SEASON", code: `${marker}SEASONX`, nameEn: "Spring", nameZh: "春季" },
      actor.id,
    );
    if (!otherType.ok) {
      throw new Error("expected season create to succeed");
    }
    expect(
      await createReferenceValue(
        {
          type: "STYLE_TYPE",
          code: `${marker}BAD`,
          nameEn: "Bad child",
          nameZh: "无效子级",
          parentId: otherType.value.id,
        },
        actor.id,
      ),
    ).toMatchObject({ ok: false, error: "PARENT_NOT_FOUND" });

    expect(await setReferenceStatus(parent.value.id, false, actor.id)).toMatchObject({
      ok: false,
      error: "HAS_ACTIVE_CHILDREN",
    });
    if (!child.ok) {
      throw new Error("expected child style type create to succeed");
    }
    expect(await setReferenceStatus(child.value.id, false, actor.id)).toMatchObject({ ok: true });
    expect(await setReferenceStatus(parent.value.id, false, actor.id)).toMatchObject({ ok: true });
  });
});
