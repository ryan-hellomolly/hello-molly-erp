import "server-only";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";
import { db } from "@/server/db";
export const templateInputSchema = z.object({
  type: z.enum(["SAMPLE", "MEASUREMENT", "CONSTRUCTION", "PROCESS"]),
  code: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/)
    .transform((x) => x.toUpperCase()),
  version: z.coerce.number().int().min(1).max(999),
  nameEn: z.string().trim().min(2).max(160),
  nameZh: z.string().trim().min(1).max(160),
  description: z.string().trim().max(500).optional(),
  content: z.record(z.string(), z.unknown()),
});
export const templateStatusSchema = z.object({ status: z.enum(["PUBLISHED", "RETIRED"]) });
const richTextHtmlSchema = z
  .string()
  .trim()
  .min(1)
  .max(100_000)
  .transform((html) =>
    sanitizeHtml(html, {
      allowedTags: [
        "p",
        "br",
        "strong",
        "b",
        "em",
        "i",
        "u",
        "s",
        "span",
        "div",
        "ul",
        "ol",
        "li",
        "blockquote",
        "h1",
        "h2",
        "h3",
        "font",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
        "img",
        "a",
      ],
      allowedAttributes: {
        "*": ["style"],
        a: ["href", "target", "rel"],
        img: ["src", "alt", "width", "height"],
        font: ["face", "size", "color"],
        table: ["border", "cellpadding", "cellspacing"],
        th: ["colspan", "rowspan"],
        td: ["colspan", "rowspan"],
      },
      allowedSchemes: ["http", "https", "mailto"],
      allowedSchemesByTag: { img: ["http", "https"] },
      allowedStyles: {
        "*": {
          color: [/^#[0-9a-f]{3,8}$/i, /^rgb\(/],
          "background-color": [/^#[0-9a-f]{3,8}$/i, /^rgb\(/],
          "font-family": [/^[\w\s,'"-]+$/],
          "font-size": [/^\d+(?:\.\d+)?(?:px|pt|em|rem|%)$/],
          "text-align": [/^(?:left|center|right|justify)$/],
          width: [/^\d+(?:\.\d+)?(?:px|em|rem|%)$/],
          height: [/^\d+(?:\.\d+)?(?:px|em|rem|%)$/],
          "max-width": [/^\d+(?:\.\d+)?(?:px|em|rem|%)$/],
          border: [/^[\w\s.#()-]+$/],
          "border-collapse": [/^(?:collapse|separate)$/],
          padding: [/^[\d\s.]+(?:px|em|rem|%)?$/],
        },
      },
    }),
  );
export const constructionTemplateUpdateSchema = z.object({
  name: z.string().trim().min(1).max(160),
  html: richTextHtmlSchema,
});
const measurementRowSchema = z.object({
  name: z.string().trim().max(160),
  method: z.string().trim().max(300),
  tolerance: z.string().trim().max(80),
  gradeRule: z.string().trim().max(80),
  patternSize: z.string().trim().max(80),
  patternValue: z.string().trim().max(80),
  notes: z.string().trim().max(300),
});
export const measurementTemplateUpdateSchema = z.discriminatedUnion("kind", [
  z.object({
    name: z.string().trim().min(1).max(160),
    kind: z.literal("BASIC"),
    html: richTextHtmlSchema,
  }),
  z.object({
    name: z.string().trim().min(1).max(160),
    kind: z.literal("SIZE_TABLE"),
    rows: z.array(measurementRowSchema).max(500),
  }),
]);
const processRowSchema = z.object({
  processName: z.string().trim().min(1).max(160),
  processingTypeId: z.string().uuid().optional(),
  workSeconds: z.coerce.number().min(0).max(100_000).default(0),
  unitPrice: z.coerce.number().min(0).max(100_000).default(0),
  tempUnitPrice: z.coerce.number().min(0).max(100_000).default(0),
  openPricing: z.boolean().default(true),
  isCountable: z.boolean().default(true),
  isKeyProcess: z.boolean().default(true),
});
export const processTemplateUpdateSchema = z.object({
  name: z.string().trim().min(1).max(160),
  rows: z.array(processRowSchema).max(500),
});
export async function createTemplate(input: z.input<typeof templateInputSchema>, actorId: string) {
  const data = templateInputSchema.parse(input);
  const content =
    (data.type === "CONSTRUCTION" || data.type === "MEASUREMENT") &&
    "html" in data.content &&
    typeof data.content.html === "string"
      ? { ...data.content, html: richTextHtmlSchema.parse(data.content.html) }
      : data.content;
  const duplicate = await db.templateMaster.findUnique({
    where: { type_code_version: { type: data.type, code: data.code, version: data.version } },
  });
  if (duplicate) {
    return { ok: false, error: "DUPLICATE_TEMPLATE_VERSION", existingId: duplicate.id } as const;
  }
  const template = await db.$transaction(async (tx) => {
    const created = await tx.templateMaster.create({
      data: {
        ...data,
        content: content as never,
        status: data.type === "SAMPLE" ? "DRAFT" : "PUBLISHED",
        publishedAt: data.type === "SAMPLE" ? null : new Date(),
      },
    });
    await tx.auditEvent.create({
      data: {
        actorId,
        action: "TEMPLATE_CREATED",
        entityType: "TemplateMaster",
        entityId: created.id,
        metadata: { type: created.type, code: created.code, version: created.version },
      },
    });
    return created;
  });
  return { ok: true, template } as const;
}
export async function listTemplates(type?: "SAMPLE" | "MEASUREMENT" | "CONSTRUCTION" | "PROCESS") {
  return db.templateMaster.findMany({
    where: type ? { type } : {},
    orderBy: [{ type: "asc" }, { code: "asc" }, { version: "desc" }],
  });
}
export async function transitionTemplate(
  id: string,
  target: "PUBLISHED" | "RETIRED",
  actorId: string,
) {
  const existing = await db.templateMaster.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false, error: "TEMPLATE_NOT_FOUND" } as const;
  }
  if (
    existing.type === "CONSTRUCTION" ||
    existing.type === "MEASUREMENT" ||
    existing.type === "PROCESS"
  ) {
    return { ok: false, error: "INVALID_TEMPLATE_TRANSITION" } as const;
  }
  const allowed =
    (existing.status === "DRAFT" && target === "PUBLISHED") ||
    (existing.status === "PUBLISHED" && target === "RETIRED");
  if (!allowed) {
    return { ok: false, error: "INVALID_TEMPLATE_TRANSITION" } as const;
  }
  const template = await db.$transaction(async (tx) => {
    const updated = await tx.templateMaster.update({
      where: { id },
      data: {
        status: target,
        publishedAt: target === "PUBLISHED" ? new Date() : existing.publishedAt,
      },
    });
    await tx.auditEvent.create({
      data: {
        actorId,
        action: `TEMPLATE_${target}`,
        entityType: "TemplateMaster",
        entityId: id,
        metadata: { before: existing.status, after: target },
      },
    });
    return updated;
  });
  return { ok: true, template } as const;
}
export async function updateConstructionTemplate(
  id: string,
  input: z.input<typeof constructionTemplateUpdateSchema>,
  actorId: string,
) {
  const data = constructionTemplateUpdateSchema.parse(input);
  const existing = await db.templateMaster.findUnique({ where: { id } });
  if (!existing || existing.type !== "CONSTRUCTION") {
    return { ok: false, error: "TEMPLATE_NOT_FOUND" } as const;
  }
  const template = await db.$transaction(async (tx) => {
    const updated = await tx.templateMaster.update({
      where: { id },
      data: {
        nameEn: data.name,
        nameZh: data.name,
        content: { format: "html", html: data.html },
      },
    });
    await tx.auditEvent.create({
      data: {
        actorId,
        action: "TEMPLATE_UPDATED",
        entityType: "TemplateMaster",
        entityId: id,
        metadata: { name: data.name, version: existing.version },
      },
    });
    return updated;
  });
  return { ok: true, template } as const;
}
export async function deleteConstructionTemplate(id: string, actorId: string) {
  const existing = await db.templateMaster.findUnique({ where: { id } });
  if (!existing || existing.type !== "CONSTRUCTION") {
    return { ok: false, error: "TEMPLATE_NOT_FOUND" } as const;
  }
  const inUseCount = await db.style.count({ where: { constructionTemplateId: id } });
  if (inUseCount > 0) {
    return { ok: false, error: "TEMPLATE_IN_USE" } as const;
  }
  await db.$transaction(async (tx) => {
    await tx.auditEvent.create({
      data: {
        actorId,
        action: "TEMPLATE_DELETED",
        entityType: "TemplateMaster",
        entityId: id,
        metadata: {
          type: existing.type,
          code: existing.code,
          version: existing.version,
          nameEn: existing.nameEn,
          nameZh: existing.nameZh,
        },
      },
    });
    await tx.templateMaster.delete({ where: { id } });
  });
  return { ok: true } as const;
}
export async function updateMeasurementTemplate(
  id: string,
  input: z.input<typeof measurementTemplateUpdateSchema>,
  actorId: string,
) {
  const data = measurementTemplateUpdateSchema.parse(input);
  const existing = await db.templateMaster.findUnique({ where: { id } });
  if (!existing || existing.type !== "MEASUREMENT") {
    return { ok: false, error: "TEMPLATE_NOT_FOUND" } as const;
  }
  const content =
    data.kind === "BASIC"
      ? { kind: data.kind, format: "html", html: data.html }
      : { kind: data.kind, rows: data.rows };
  const template = await db.$transaction(async (tx) => {
    const updated = await tx.templateMaster.update({
      where: { id },
      data: { nameEn: data.name, nameZh: data.name, content },
    });
    await tx.auditEvent.create({
      data: {
        actorId,
        action: "TEMPLATE_UPDATED",
        entityType: "TemplateMaster",
        entityId: id,
        metadata: { name: data.name, kind: data.kind, version: existing.version },
      },
    });
    return updated;
  });
  return { ok: true, template } as const;
}

export async function deleteMeasurementTemplate(id: string, actorId: string) {
  const existing = await db.templateMaster.findUnique({ where: { id } });
  if (!existing || existing.type !== "MEASUREMENT") {
    return { ok: false, error: "TEMPLATE_NOT_FOUND" } as const;
  }
  const inUseCount = await db.style.count({ where: { measurementTemplateId: id } });
  if (inUseCount > 0) {
    return { ok: false, error: "TEMPLATE_IN_USE" } as const;
  }
  await db.$transaction(async (tx) => {
    await tx.auditEvent.create({
      data: {
        actorId,
        action: "TEMPLATE_DELETED",
        entityType: "TemplateMaster",
        entityId: id,
        metadata: { type: existing.type, code: existing.code, nameZh: existing.nameZh },
      },
    });
    await tx.templateMaster.delete({ where: { id } });
  });
  return { ok: true } as const;
}
export async function updateProcessTemplate(
  id: string,
  input: z.input<typeof processTemplateUpdateSchema>,
  actorId: string,
) {
  const data = processTemplateUpdateSchema.parse(input);
  const existing = await db.templateMaster.findUnique({ where: { id } });
  if (!existing || existing.type !== "PROCESS") {
    return { ok: false, error: "TEMPLATE_NOT_FOUND" } as const;
  }
  const template = await db.$transaction(async (tx) => {
    const updated = await tx.templateMaster.update({
      where: { id },
      data: { nameEn: data.name, nameZh: data.name, content: { rows: data.rows } },
    });
    await tx.auditEvent.create({
      data: {
        actorId,
        action: "TEMPLATE_UPDATED",
        entityType: "TemplateMaster",
        entityId: id,
        metadata: { name: data.name, version: existing.version },
      },
    });
    return updated;
  });
  return { ok: true, template } as const;
}
export async function deleteProcessTemplate(id: string, actorId: string) {
  const existing = await db.templateMaster.findUnique({ where: { id } });
  if (!existing || existing.type !== "PROCESS") {
    return { ok: false, error: "TEMPLATE_NOT_FOUND" } as const;
  }
  await db.$transaction(async (tx) => {
    await tx.auditEvent.create({
      data: {
        actorId,
        action: "TEMPLATE_DELETED",
        entityType: "TemplateMaster",
        entityId: id,
        metadata: { type: existing.type, code: existing.code, nameZh: existing.nameZh },
      },
    });
    await tx.templateMaster.delete({ where: { id } });
  });
  return { ok: true } as const;
}
