import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { createCustomer } from "@/server/customers/service";
import { createReferenceValue } from "@/server/reference-data/service";
import { createTemplate, deleteConstructionTemplate } from "@/server/templates/service";
import {
  addStyleColorway,
  createStyle,
  isValidStyleTransition,
  listStyleAuditEvents,
  listStyles,
  setStyleColorwayStatus,
  setStyleStatus,
  updateStyle,
} from "./service";

const marker = `STY${Date.now()}`;

afterAll(async () => {
  const rows = await db.style.findMany({
    where: { code: { startsWith: marker } },
    select: { id: true },
  });
  const ids = rows.map(({ id }) => id);
  await db.auditEvent.deleteMany({ where: { entityType: "Style", entityId: { in: ids } } });
  await db.styleColorway.deleteMany({ where: { styleId: { in: ids } } });
  await db.style.deleteMany({ where: { id: { in: ids } } });

  const customers = await db.customer.findMany({
    where: { code: { startsWith: marker } },
    select: { id: true },
  });
  const customerIds = customers.map(({ id }) => id);
  await db.auditEvent.deleteMany({
    where: { entityType: "Customer", entityId: { in: customerIds } },
  });
  await db.customer.deleteMany({ where: { id: { in: customerIds } } });

  const units = await db.referenceValue.findMany({
    where: { code: { startsWith: marker } },
    select: { id: true },
  });
  const unitIds = units.map(({ id }) => id);
  await db.auditEvent.deleteMany({
    where: { entityType: "ReferenceValue", entityId: { in: unitIds } },
  });
  await db.referenceValue.deleteMany({ where: { id: { in: unitIds } } });

  const templates = await db.templateMaster.findMany({
    where: { code: { startsWith: marker } },
    select: { id: true },
  });
  const templateIds = templates.map(({ id }) => id);
  await db.auditEvent.deleteMany({
    where: { entityType: "TemplateMaster", entityId: { in: templateIds } },
  });
  await db.templateMaster.deleteMany({ where: { id: { in: templateIds } } });

  await db.$disconnect();
});

describe("style status transitions", () => {
  it("only allows the approved forward/discontinue/reactivate paths", () => {
    expect(isValidStyleTransition("DRAFT", "IN_DEVELOPMENT")).toBe(true);
    expect(isValidStyleTransition("IN_DEVELOPMENT", "SAMPLE_APPROVED")).toBe(true);
    expect(isValidStyleTransition("SAMPLE_APPROVED", "ACTIVE")).toBe(true);
    expect(isValidStyleTransition("DRAFT", "ACTIVE")).toBe(false);
    expect(isValidStyleTransition("ACTIVE", "DRAFT")).toBe(false);
    expect(isValidStyleTransition("DRAFT", "DISCONTINUED")).toBe(true);
    expect(isValidStyleTransition("ACTIVE", "DISCONTINUED")).toBe(true);
    expect(isValidStyleTransition("DISCONTINUED", "ACTIVE")).toBe(true);
    expect(isValidStyleTransition("DISCONTINUED", "DRAFT")).toBe(false);
  });
});

describe("style master", () => {
  it("creates, lists, searches and rejects duplicate style codes", async () => {
    const actor = await db.user.findFirstOrThrow();
    expect(
      await createStyle({ code: `${marker}A`, nameEn: "Basic Tee", nameZh: "基础T恤" }, actor.id),
    ).toMatchObject({ ok: true });
    expect(
      await createStyle({ code: `${marker}A`, nameEn: "Duplicate", nameZh: "重复" }, actor.id),
    ).toMatchObject({ ok: false, error: "DUPLICATE_STYLE" });
    const result = await listStyles({ search: marker, pageSize: 50 });
    expect(result.total).toBe(1);
    expect(result.data[0]).toMatchObject({ code: `${marker}A` });
  });

  it("validates related customer/unit/template references on create", async () => {
    const actor = await db.user.findFirstOrThrow();
    expect(
      await createStyle(
        {
          code: `${marker}BAD`,
          nameEn: "Bad refs",
          nameZh: "无效引用",
          customerId: "00000000-0000-0000-0000-000000000000",
        },
        actor.id,
      ),
    ).toMatchObject({ ok: false, error: "CUSTOMER_NOT_FOUND" });
    expect(
      await createStyle(
        {
          code: `${marker}BAD2`,
          nameEn: "Bad style type",
          nameZh: "无效类型",
          styleTypeId: "00000000-0000-0000-0000-000000000000",
        },
        actor.id,
      ),
    ).toMatchObject({ ok: false, error: "INVALID_STYLE_TYPE" });
  });

  it("updates fields, transitions status and audits every mutation", async () => {
    const actor = await db.user.findFirstOrThrow();
    const customer = await createCustomer({
      code: `${marker}CUST`,
      name: "Style Customer",
      countryCode: "AU",
    });
    if (!customer.ok) {
      throw new Error("expected customer create to succeed");
    }
    const style = await createStyle(
      { code: `${marker}B`, nameEn: "Denim Jacket", nameZh: "牛仔夹克" },
      actor.id,
    );
    if (!style.ok) {
      throw new Error("expected style create to succeed");
    }
    const styleId = style.style.id;

    expect(
      await updateStyle(
        styleId,
        { nameEn: "Denim Jacket v2", nameZh: "牛仔夹克 v2", customerId: customer.customer.id },
        actor.id,
      ),
    ).toMatchObject({ ok: true, style: { nameEn: "Denim Jacket v2" } });

    expect(await setStyleStatus(styleId, "ACTIVE", actor.id)).toMatchObject({
      ok: false,
      error: "INVALID_STYLE_TRANSITION",
    });
    expect(await setStyleStatus(styleId, "IN_DEVELOPMENT", actor.id)).toMatchObject({ ok: true });
    expect(await setStyleStatus(styleId, "SAMPLE_APPROVED", actor.id)).toMatchObject({ ok: true });
    expect(await setStyleStatus(styleId, "ACTIVE", actor.id)).toMatchObject({ ok: true });

    const colorway = await addStyleColorway(
      styleId,
      { colorCode: "BLK", colorNameEn: "Black", colorNameZh: "黑色" },
      actor.id,
    );
    expect(colorway).toMatchObject({ ok: true });
    if (!colorway.ok) {
      throw new Error("expected colorway create to succeed");
    }
    expect(
      await addStyleColorway(
        styleId,
        { colorCode: "blk", colorNameEn: "Black Again", colorNameZh: "黑色二号" },
        actor.id,
      ),
    ).toMatchObject({ ok: false, error: "DUPLICATE_COLORWAY" });
    expect(
      await setStyleColorwayStatus(styleId, colorway.colorway.id, "DISCONTINUED", actor.id),
    ).toMatchObject({ ok: true, colorway: { status: "DISCONTINUED" } });

    expect((await listStyleAuditEvents(styleId)).map(({ action }) => action)).toEqual([
      "STYLE_COLORWAY_DISCONTINUED",
      "STYLE_COLORWAY_ADDED",
      "STYLE_ACTIVE",
      "STYLE_SAMPLE_APPROVED",
      "STYLE_IN_DEVELOPMENT",
      "STYLE_UPDATED",
      "STYLE_CREATED",
    ]);
  });

  it("associates a finished-goods unit and construction/measurement templates", async () => {
    const actor = await db.user.findFirstOrThrow();
    const unit = await createReferenceValue(
      {
        type: "UNIT",
        code: `${marker}UNIT`,
        nameEn: "Piece",
        nameZh: "件",
        category: "FINISHED_GOODS",
      },
      actor.id,
    );
    if (!unit.ok) {
      throw new Error("expected unit create to succeed");
    }
    const construction = await createTemplate(
      {
        type: "CONSTRUCTION",
        code: `${marker}CONS`,
        version: 1,
        nameEn: "Basic construction",
        nameZh: "基础工艺",
        content: { html: "<p>Construction notes</p>" },
      },
      actor.id,
    );
    if (!construction.ok) {
      throw new Error("expected construction template create to succeed");
    }
    const styleType = await createReferenceValue(
      { type: "STYLE_TYPE", code: `${marker}TYPE`, nameEn: "Dress", nameZh: "连衣裙" },
      actor.id,
    );
    const season = await createReferenceValue(
      { type: "SEASON", code: `${marker}SEASON`, nameEn: "Spring/Summer", nameZh: "春夏" },
      actor.id,
    );
    const year = await createReferenceValue(
      { type: "YEAR", code: `${marker}YEAR`, nameEn: "2026", nameZh: "2026" },
      actor.id,
    );
    const stage = await createReferenceValue(
      { type: "STAGE", code: `${marker}STAGE`, nameEn: "Wave 1", nameZh: "第一波段" },
      actor.id,
    );
    if (!styleType.ok || !season.ok || !year.ok || !stage.ok) {
      throw new Error("expected style-type/season/year/stage reference create to succeed");
    }

    const style = await createStyle(
      {
        code: `${marker}C`,
        nameEn: "Linked style",
        nameZh: "关联款式",
        unitId: unit.value.id,
        constructionTemplateId: construction.template.id,
        styleTypeId: styleType.value.id,
        seasonId: season.value.id,
        yearId: year.value.id,
        stageId: stage.value.id,
      },
      actor.id,
    );
    expect(style).toMatchObject({
      ok: true,
      style: {
        unitId: unit.value.id,
        constructionTemplateId: construction.template.id,
        styleTypeId: styleType.value.id,
        seasonId: season.value.id,
        yearId: year.value.id,
        stageId: stage.value.id,
      },
    });

    expect(await deleteConstructionTemplate(construction.template.id, actor.id)).toMatchObject({
      ok: false,
      error: "TEMPLATE_IN_USE",
    });
  });
});
