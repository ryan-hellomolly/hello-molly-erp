import "server-only";
import { z } from "zod";
import { db } from "@/server/db";

export const referenceInputSchema = z
  .object({
    type: z.enum([
      "SIZE",
      "UNIT",
      "CURRENCY",
      "TRADE_TERM",
      "SETTLEMENT_METHOD",
      "INVOICE_TYPE",
      "SAMPLE_TYPE",
      "EXPENSE_TYPE",
      "SALES_CHANNEL",
      "STYLE_TYPE",
      "SEASON",
      "YEAR",
      "STAGE",
      "PROCESSING_TYPE",
      "WASH_TYPE",
      "FABRIC_TRIM_TYPE",
      "EXECUTION_STANDARD",
    ]),
    code: z
      .string()
      .trim()
      .min(1)
      .max(30)
      .transform((x) => x.toUpperCase()),
    nameEn: z.string().trim().min(1).max(120),
    nameZh: z.string().trim().min(1).max(120),
    category: z.string().trim().max(80).optional(),
    symbol: z.string().trim().max(12).optional(),
    descriptionEn: z.string().trim().max(500).optional(),
    descriptionZh: z.string().trim().max(500).optional(),
    sortOrder: z.coerce.number().int().min(0).max(10000).default(0),
    decimalPlaces: z.coerce.number().int().min(0).max(6).default(0),
    parentId: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "CURRENCY" && !/^[A-Z]{3}$/.test(data.code)) {
      ctx.addIssue({
        code: "custom",
        path: ["code"],
        message: "Currency code must be three letters",
      });
    }
    if (data.type === "UNIT" && !data.category) {
      ctx.addIssue({ code: "custom", path: ["category"], message: "Unit category is required" });
    }
  });
export const referenceStatusSchema = z.object({ active: z.boolean() });
export const referenceUpdateSchema = referenceInputSchema;
export async function createReferenceValue(
  input: z.input<typeof referenceInputSchema>,
  actorId: string,
) {
  const data = referenceInputSchema.parse(input);
  const duplicate = await db.referenceValue.findUnique({
    where: { type_code: { type: data.type, code: data.code } },
  });
  if (duplicate) {
    return { ok: false, error: "DUPLICATE_REFERENCE", existingId: duplicate.id } as const;
  }
  if (data.parentId) {
    const parent = await db.referenceValue.findUnique({
      where: { id: data.parentId },
      select: { type: true },
    });
    if (!parent || parent.type !== data.type) {
      return { ok: false, error: "PARENT_NOT_FOUND" } as const;
    }
  }
  const value = await db.$transaction(async (tx) => {
    const created = await tx.referenceValue.create({ data });
    await tx.auditEvent.create({
      data: {
        actorId,
        action: "REFERENCE_CREATED",
        entityType: "ReferenceValue",
        entityId: created.id,
        metadata: { type: created.type, code: created.code },
      },
    });
    return created;
  });
  return { ok: true, value } as const;
}
export type ReferenceKind = z.infer<typeof referenceInputSchema>["type"];
export async function listReferenceValues(type?: ReferenceKind) {
  return db.referenceValue.findMany({
    where: type ? { type } : {},
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { code: "asc" }],
  });
}
export async function setReferenceStatus(id: string, active: boolean, actorId: string) {
  const existing = await db.referenceValue.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false, error: "REFERENCE_NOT_FOUND" } as const;
  }
  if (!active) {
    const activeChildren = await db.referenceValue.count({
      where: { parentId: id, active: true },
    });
    if (activeChildren > 0) {
      return { ok: false, error: "HAS_ACTIVE_CHILDREN" } as const;
    }
  }
  const value = await db.$transaction(async (tx) => {
    const updated = await tx.referenceValue.update({ where: { id }, data: { active } });
    await tx.auditEvent.create({
      data: {
        actorId,
        action: active ? "REFERENCE_ACTIVATED" : "REFERENCE_DEACTIVATED",
        entityType: "ReferenceValue",
        entityId: id,
        metadata: { type: existing.type, code: existing.code },
      },
    });
    return updated;
  });
  return { ok: true, value } as const;
}

export async function updateReferenceValue(
  id: string,
  input: z.input<typeof referenceUpdateSchema>,
  actorId: string,
) {
  const data = referenceUpdateSchema.parse(input);
  const existing = await db.referenceValue.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false, error: "REFERENCE_NOT_FOUND" } as const;
  }
  if (data.parentId === id) {
    return { ok: false, error: "PARENT_NOT_FOUND" } as const;
  }
  if (data.parentId) {
    const parent = await db.referenceValue.findUnique({
      where: { id: data.parentId },
      select: { type: true },
    });
    if (!parent || parent.type !== data.type) {
      return { ok: false, error: "PARENT_NOT_FOUND" } as const;
    }
  }
  const duplicate = await db.referenceValue.findFirst({
    where: { type: data.type, code: data.code, id: { not: id } },
  });
  if (duplicate) {
    return { ok: false, error: "DUPLICATE_REFERENCE", existingId: duplicate.id } as const;
  }
  const value = await db.$transaction(async (tx) => {
    const updated = await tx.referenceValue.update({ where: { id }, data });
    await tx.auditEvent.create({
      data: {
        actorId,
        action: "REFERENCE_UPDATED",
        entityType: "ReferenceValue",
        entityId: id,
        metadata: { type: updated.type, code: updated.code },
      },
    });
    return updated;
  });
  return { ok: true, value } as const;
}
