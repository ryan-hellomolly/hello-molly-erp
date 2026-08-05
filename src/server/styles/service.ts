import "server-only";
import { z } from "zod";
import { db } from "@/server/db";

const optionalText = (max: number) => z.string().trim().max(max).optional();
const uuid = () => z.string().uuid();

const styleFields = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(30)
    .regex(/^[A-Za-z0-9_-]+$/),
  nameEn: z.string().trim().min(2).max(160),
  nameZh: z.string().trim().min(1).max(160),
  styleTypeId: uuid().optional(),
  seasonId: uuid().optional(),
  yearId: uuid().optional(),
  stageId: uuid().optional(),
  customerId: uuid().optional(),
  unitId: uuid().optional(),
  constructionTemplateId: uuid().optional(),
  measurementTemplateId: uuid().optional(),
  designNumber: optionalText(60),
  patternMakerName: optionalText(120),
  composition: optionalText(500),
  brandPrice: z.coerce.number().min(0).max(1_000_000).optional(),
  canSample: z.boolean().optional().default(false),
  notes: optionalText(2000),
});
export const createStyleSchema = styleFields;
export const updateStyleSchema = styleFields.omit({ code: true });
export const styleStatusSchema = z.object({
  status: z.enum(["DRAFT", "IN_DEVELOPMENT", "SAMPLE_APPROVED", "ACTIVE", "DISCONTINUED"]),
});
export type StyleStatus = z.infer<typeof styleStatusSchema>["status"];
export const colorwaySchema = z.object({
  colorCode: z
    .string()
    .trim()
    .min(1)
    .max(20)
    .regex(/^[A-Za-z0-9_-]+$/),
  colorNameEn: z.string().trim().min(1).max(120),
  colorNameZh: z.string().trim().min(1).max(120),
});
export const colorwayStatusSchema = z.object({ status: z.enum(["ACTIVE", "DISCONTINUED"]) });

const STATUS_ORDER = ["DRAFT", "IN_DEVELOPMENT", "SAMPLE_APPROVED", "ACTIVE"] as const;
export function isValidStyleTransition(from: StyleStatus, to: StyleStatus) {
  if (from === to) {
    return false;
  }
  if (to === "DISCONTINUED") {
    return from !== "DISCONTINUED";
  }
  if (from === "DISCONTINUED") {
    return to === "ACTIVE";
  }
  const fromIndex = STATUS_ORDER.indexOf(from);
  const toIndex = STATUS_ORDER.indexOf(to);
  return fromIndex >= 0 && toIndex === fromIndex + 1;
}

async function validateStyleReferences(data: {
  styleTypeId?: string;
  seasonId?: string;
  yearId?: string;
  stageId?: string;
  customerId?: string;
  unitId?: string;
  constructionTemplateId?: string;
  measurementTemplateId?: string;
}) {
  if (
    data.customerId &&
    !(await db.customer.findUnique({ where: { id: data.customerId }, select: { id: true } }))
  ) {
    return "CUSTOMER_NOT_FOUND" as const;
  }
  if (
    data.unitId &&
    !(await db.referenceValue.findFirst({
      where: { id: data.unitId, type: "UNIT" },
      select: { id: true },
    }))
  ) {
    return "INVALID_UNIT" as const;
  }
  if (
    data.styleTypeId &&
    !(await db.referenceValue.findFirst({
      where: { id: data.styleTypeId, type: "STYLE_TYPE" },
      select: { id: true },
    }))
  ) {
    return "INVALID_STYLE_TYPE" as const;
  }
  if (
    data.seasonId &&
    !(await db.referenceValue.findFirst({
      where: { id: data.seasonId, type: "SEASON" },
      select: { id: true },
    }))
  ) {
    return "INVALID_SEASON" as const;
  }
  if (
    data.yearId &&
    !(await db.referenceValue.findFirst({
      where: { id: data.yearId, type: "YEAR" },
      select: { id: true },
    }))
  ) {
    return "INVALID_YEAR" as const;
  }
  if (
    data.stageId &&
    !(await db.referenceValue.findFirst({
      where: { id: data.stageId, type: "STAGE" },
      select: { id: true },
    }))
  ) {
    return "INVALID_STAGE" as const;
  }
  if (
    data.constructionTemplateId &&
    !(await db.templateMaster.findFirst({
      where: { id: data.constructionTemplateId, type: "CONSTRUCTION" },
      select: { id: true },
    }))
  ) {
    return "INVALID_CONSTRUCTION_TEMPLATE" as const;
  }
  if (
    data.measurementTemplateId &&
    !(await db.templateMaster.findFirst({
      where: { id: data.measurementTemplateId, type: "MEASUREMENT" },
      select: { id: true },
    }))
  ) {
    return "INVALID_MEASUREMENT_TEMPLATE" as const;
  }
  return null;
}

export async function createStyle(input: z.input<typeof createStyleSchema>, actorId: string) {
  const data = createStyleSchema.parse(input);
  const duplicate = await db.style.findFirst({
    where: { code: { equals: data.code, mode: "insensitive" } },
  });
  if (duplicate) {
    return { ok: false, error: "DUPLICATE_STYLE", existingId: duplicate.id } as const;
  }
  const referenceError = await validateStyleReferences(data);
  if (referenceError) {
    return { ok: false, error: referenceError } as const;
  }
  const style = await db.$transaction(async (tx) => {
    const created = await tx.style.create({ data: { ...data, code: data.code.toUpperCase() } });
    await tx.auditEvent.create({
      data: {
        actorId,
        action: "STYLE_CREATED",
        entityType: "Style",
        entityId: created.id,
        metadata: { code: created.code, nameEn: created.nameEn },
      },
    });
    return created;
  });
  return { ok: true, style } as const;
}

const sortFields = {
  code: "code",
  nameEn: "nameEn",
  status: "status",
  createdAt: "createdAt",
} as const;
export async function listStyles({
  page = 1,
  pageSize = 20,
  search = "",
  sort = "code",
  direction = "asc",
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: keyof typeof sortFields;
  direction?: "asc" | "desc";
} = {}) {
  const safePage = Math.max(1, page);
  const safeSize = Math.min(100, Math.max(1, pageSize));
  const term = search.trim();
  const where = term
    ? {
        OR: [
          { code: { contains: term, mode: "insensitive" as const } },
          { nameEn: { contains: term, mode: "insensitive" as const } },
          { nameZh: { contains: term, mode: "insensitive" as const } },
        ],
      }
    : {};
  const [data, total] = await Promise.all([
    db.style.findMany({
      where,
      include: {
        customer: { select: { code: true, name: true } },
        styleType: { select: { nameEn: true, nameZh: true } },
        season: { select: { nameEn: true, nameZh: true } },
        _count: { select: { colorways: true } },
      },
      orderBy: { [sortFields[sort]]: direction },
      skip: (safePage - 1) * safeSize,
      take: safeSize,
    }),
    db.style.count({ where }),
  ]);
  return {
    data,
    total,
    page: safePage,
    pageSize: safeSize,
    pageCount: Math.max(1, Math.ceil(total / safeSize)),
  };
}

export async function getStyle(id: string) {
  return db.style.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, code: true, name: true } },
      unit: { select: { id: true, nameEn: true, nameZh: true, symbol: true } },
      styleType: { select: { id: true, nameEn: true, nameZh: true } },
      season: { select: { id: true, nameEn: true, nameZh: true } },
      year: { select: { id: true, nameEn: true, nameZh: true } },
      stage: { select: { id: true, nameEn: true, nameZh: true } },
      constructionTemplate: { select: { id: true, code: true, nameEn: true, nameZh: true } },
      measurementTemplate: { select: { id: true, code: true, nameEn: true, nameZh: true } },
      colorways: { orderBy: [{ sortOrder: "asc" }, { colorCode: "asc" }] },
    },
  });
}

export async function updateStyle(
  id: string,
  input: z.input<typeof updateStyleSchema>,
  actorId: string,
) {
  const data = updateStyleSchema.parse(input);
  const existing = await db.style.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false, error: "STYLE_NOT_FOUND" } as const;
  }
  const referenceError = await validateStyleReferences(data);
  if (referenceError) {
    return { ok: false, error: referenceError } as const;
  }
  const style = await db.$transaction(async (tx) => {
    const updated = await tx.style.update({ where: { id }, data });
    await tx.auditEvent.create({
      data: {
        actorId,
        action: "STYLE_UPDATED",
        entityType: "Style",
        entityId: id,
        metadata: { beforeName: existing.nameEn, afterName: updated.nameEn },
      },
    });
    return updated;
  });
  return { ok: true, style } as const;
}

export async function setStyleStatus(id: string, status: StyleStatus, actorId: string) {
  const existing = await db.style.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false, error: "STYLE_NOT_FOUND" } as const;
  }
  if (!isValidStyleTransition(existing.status, status)) {
    return { ok: false, error: "INVALID_STYLE_TRANSITION" } as const;
  }
  const style = await db.$transaction(async (tx) => {
    const updated = await tx.style.update({ where: { id }, data: { status } });
    await tx.auditEvent.create({
      data: {
        actorId,
        action: `STYLE_${status}`,
        entityType: "Style",
        entityId: id,
        metadata: { before: existing.status, after: status },
      },
    });
    return updated;
  });
  return { ok: true, style } as const;
}

export async function addStyleColorway(
  id: string,
  input: z.input<typeof colorwaySchema>,
  actorId: string,
) {
  const data = colorwaySchema.parse(input);
  if (!(await db.style.findUnique({ where: { id }, select: { id: true } }))) {
    return { ok: false, error: "STYLE_NOT_FOUND" } as const;
  }
  const duplicate = await db.styleColorway.findUnique({
    where: { styleId_colorCode: { styleId: id, colorCode: data.colorCode.toUpperCase() } },
  });
  if (duplicate) {
    return { ok: false, error: "DUPLICATE_COLORWAY" } as const;
  }
  const colorway = await db.$transaction(async (tx) => {
    const created = await tx.styleColorway.create({
      data: { styleId: id, ...data, colorCode: data.colorCode.toUpperCase() },
    });
    await tx.auditEvent.create({
      data: {
        actorId,
        action: "STYLE_COLORWAY_ADDED",
        entityType: "Style",
        entityId: id,
        metadata: { colorwayId: created.id, colorCode: created.colorCode },
      },
    });
    return created;
  });
  return { ok: true, colorway } as const;
}

export async function setStyleColorwayStatus(
  styleId: string,
  colorwayId: string,
  status: "ACTIVE" | "DISCONTINUED",
  actorId: string,
) {
  const existing = await db.styleColorway.findUnique({ where: { id: colorwayId } });
  if (!existing || existing.styleId !== styleId) {
    return { ok: false, error: "COLORWAY_NOT_FOUND" } as const;
  }
  const colorway = await db.$transaction(async (tx) => {
    const updated = await tx.styleColorway.update({ where: { id: colorwayId }, data: { status } });
    await tx.auditEvent.create({
      data: {
        actorId,
        action: `STYLE_COLORWAY_${status}`,
        entityType: "Style",
        entityId: styleId,
        metadata: { colorwayId, before: existing.status, after: status },
      },
    });
    return updated;
  });
  return { ok: true, colorway } as const;
}

export async function listStyleAuditEvents(id: string) {
  return db.auditEvent.findMany({
    where: { entityType: "Style", entityId: id },
    include: { actor: { select: { displayName: true, email: true } } },
    orderBy: { occurredAt: "desc" },
  });
}
