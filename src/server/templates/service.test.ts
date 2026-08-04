import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { createReferenceValue } from "@/server/reference-data/service";
import {
  createTemplate,
  deleteConstructionTemplate,
  deleteMeasurementTemplate,
  deleteProcessTemplate,
  listTemplates,
  transitionTemplate,
  updateConstructionTemplate,
  updateMeasurementTemplate,
  updateProcessTemplate,
} from "./service";
const marker = `T${Date.now()}`;
afterAll(async () => {
  const rows = await db.templateMaster.findMany({
    where: { code: { startsWith: marker } },
    select: { id: true },
  });
  const ids = rows.map(({ id }) => id);
  await db.auditEvent.deleteMany({
    where: { entityType: "TemplateMaster", entityId: { in: ids } },
  });
  await db.templateMaster.deleteMany({ where: { id: { in: ids } } });

  const refs = await db.referenceValue.findMany({
    where: { code: { startsWith: marker } },
    select: { id: true },
  });
  const refIds = refs.map(({ id }) => id);
  await db.auditEvent.deleteMany({
    where: { entityType: "ReferenceValue", entityId: { in: refIds } },
  });
  await db.referenceValue.deleteMany({ where: { id: { in: refIds } } });

  await db.$disconnect();
});
describe("template masters", () => {
  it("creates typed versions and rejects duplicates", async () => {
    const actor = await db.user.findFirstOrThrow();
    const input = {
      type: "MEASUREMENT" as const,
      code: `${marker}M`,
      version: 1,
      nameEn: "Dress measurements",
      nameZh: "连衣裙度量",
      content: { fields: ["bust", "waist"] },
    };
    expect(await createTemplate(input, actor.id)).toMatchObject({
      ok: true,
      template: { status: "PUBLISHED" },
    });
    expect(await createTemplate(input, actor.id)).toMatchObject({
      ok: false,
      error: "DUPLICATE_TEMPLATE_VERSION",
    });
    expect((await listTemplates("MEASUREMENT")).some(({ code }) => code === `${marker}M`)).toBe(
      true,
    );
  });
  it("enforces publish and retire transitions", async () => {
    const actor = await db.user.findFirstOrThrow();
    const created = await createTemplate(
      {
        type: "SAMPLE",
        code: `${marker}S`,
        version: 1,
        nameEn: "Sample lifecycle",
        nameZh: "样板流程",
        content: { sections: [] },
      },
      actor.id,
    );
    if (!created.ok) {
      throw new Error("Expected sample template creation to succeed");
    }
    const row = created.template;
    expect(await transitionTemplate(row.id, "RETIRED", actor.id)).toMatchObject({
      ok: false,
      error: "INVALID_TEMPLATE_TRANSITION",
    });
    expect(await transitionTemplate(row.id, "PUBLISHED", actor.id)).toMatchObject({
      ok: true,
      template: { status: "PUBLISHED" },
    });
    expect(await transitionTemplate(row.id, "RETIRED", actor.id)).toMatchObject({
      ok: true,
      template: { status: "RETIRED" },
    });
    expect(await transitionTemplate(row.id, "PUBLISHED", actor.id)).toMatchObject({
      ok: false,
      error: "INVALID_TEMPLATE_TRANSITION",
    });
  });
  it("updates and deletes both measurement template kinds", async () => {
    const actor = await db.user.findFirstOrThrow();
    const row = await db.templateMaster.findFirstOrThrow({ where: { code: `${marker}M` } });
    expect(
      await updateMeasurementTemplate(
        row.id,
        { name: "基础尺寸说明", kind: "BASIC", html: "<p>量度说明</p>" },
        actor.id,
      ),
    ).toMatchObject({ ok: true, template: { content: { kind: "BASIC" } } });
    expect(
      await updateMeasurementTemplate(
        row.id,
        {
          name: "上衣尺寸",
          kind: "SIZE_TABLE",
          rows: [
            {
              name: "衣长",
              method: "肩高点至下摆",
              tolerance: "±1cm",
              gradeRule: "2cm",
              patternSize: "M",
              patternValue: "58.5",
              notes: "",
            },
          ],
        },
        actor.id,
      ),
    ).toMatchObject({ ok: true, template: { content: { kind: "SIZE_TABLE" } } });
    expect(await deleteMeasurementTemplate(row.id, actor.id)).toEqual({ ok: true });
    await db.auditEvent.deleteMany({ where: { entityType: "TemplateMaster", entityId: row.id } });
  });
  it("creates construction templates ready to use and keeps them editable", async () => {
    const actor = await db.user.findFirstOrThrow();
    const created = await createTemplate(
      {
        type: "CONSTRUCTION",
        code: `${marker}C`,
        version: 1,
        nameEn: "Original",
        nameZh: "原名称",
        content: {
          format: "html",
          html: '<p onclick="alert(1)">Original<script>alert(1)</script></p>',
        },
      },
      actor.id,
    );
    if (!created.ok) {
      throw new Error("Expected construction template creation to succeed");
    }
    expect(created.template.content).toEqual({
      format: "html",
      html: "<p>Original</p>",
    });
    expect(created.template.status).toBe("PUBLISHED");
    const result = await updateConstructionTemplate(
      created.template.id,
      {
        name: "车缝要求",
        html: '<p style="text-align:center" onclick="alert(1)"><strong>整烫</strong><script>alert(1)</script></p>',
      },
      actor.id,
    );
    expect(result).toMatchObject({
      ok: true,
      template: {
        nameEn: "车缝要求",
        nameZh: "车缝要求",
        content: {
          format: "html",
          html: '<p style="text-align:center"><strong>整烫</strong></p>',
        },
      },
    });
    expect(
      await updateConstructionTemplate(
        created.template.id,
        { name: "更新后的工艺要求", html: "<p>Published and editable</p>" },
        actor.id,
      ),
    ).toMatchObject({ ok: true, template: { nameZh: "更新后的工艺要求" } });
    expect(await transitionTemplate(created.template.id, "RETIRED", actor.id)).toMatchObject({
      ok: false,
      error: "INVALID_TEMPLATE_TRANSITION",
    });
    expect(await deleteConstructionTemplate(created.template.id, actor.id)).toEqual({ ok: true });
    expect(await db.templateMaster.findUnique({ where: { id: created.template.id } })).toBeNull();
    expect(
      await db.auditEvent.findFirst({
        where: {
          entityType: "TemplateMaster",
          entityId: created.template.id,
          action: "TEMPLATE_DELETED",
        },
      }),
    ).not.toBeNull();
    await db.auditEvent.deleteMany({
      where: { entityType: "TemplateMaster", entityId: created.template.id },
    });
  });
  it("creates process templates, blocks transitions and round-trips rows", async () => {
    const actor = await db.user.findFirstOrThrow();
    const processingType = await createReferenceValue(
      { type: "PROCESSING_TYPE", code: `${marker}PT`, nameEn: "Sewing", nameZh: "车缝" },
      actor.id,
    );
    if (!processingType.ok) {
      throw new Error("Expected processing type reference create to succeed");
    }
    const created = await createTemplate(
      {
        type: "PROCESS",
        code: `${marker}P`,
        version: 1,
        nameEn: "Basic tee process",
        nameZh: "基础T恤工序",
        content: {
          rows: [
            {
              processName: "封肩缝车埋左夹",
              processingTypeId: processingType.value.id,
              workSeconds: 0,
              unitPrice: 0.08,
              tempUnitPrice: 0,
              openPricing: true,
              isCountable: true,
              isKeyProcess: true,
            },
          ],
        },
      },
      actor.id,
    );
    expect(created).toMatchObject({ ok: true, template: { status: "PUBLISHED" } });
    if (!created.ok) {
      throw new Error("Expected process template creation to succeed");
    }
    expect(await transitionTemplate(created.template.id, "RETIRED", actor.id)).toMatchObject({
      ok: false,
      error: "INVALID_TEMPLATE_TRANSITION",
    });
    const updated = await updateProcessTemplate(
      created.template.id,
      {
        name: "基础T恤工序 v2",
        rows: [
          {
            processName: "裁剪",
            processingTypeId: processingType.value.id,
            workSeconds: 1,
            unitPrice: 0,
            tempUnitPrice: 0,
            openPricing: true,
            isCountable: true,
            isKeyProcess: true,
          },
          {
            processName: "钉车上袖1",
            workSeconds: 0,
            unitPrice: 0.2,
            tempUnitPrice: 0,
            openPricing: true,
            isCountable: true,
            isKeyProcess: false,
          },
        ],
      },
      actor.id,
    );
    expect(updated).toMatchObject({
      ok: true,
      template: {
        nameZh: "基础T恤工序 v2",
        content: {
          rows: [
            { processName: "裁剪", processingTypeId: processingType.value.id },
            { processName: "钉车上袖1", isKeyProcess: false },
          ],
        },
      },
    });
    expect(
      await updateProcessTemplate(crypto.randomUUID(), { name: "x", rows: [] }, actor.id),
    ).toMatchObject({ ok: false, error: "TEMPLATE_NOT_FOUND" });
    expect(await deleteProcessTemplate(created.template.id, actor.id)).toEqual({ ok: true });
    expect(await db.templateMaster.findUnique({ where: { id: created.template.id } })).toBeNull();
    await db.auditEvent.deleteMany({
      where: { entityType: "TemplateMaster", entityId: created.template.id },
    });
  });
});
