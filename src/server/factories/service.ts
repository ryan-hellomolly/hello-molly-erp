import "server-only";
import { z } from "zod";
import { db } from "@/server/db";

const optionalText = (max: number) => z.string().trim().max(max).optional();
export const createFactorySchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(30)
    .regex(/^[A-Za-z0-9_-]+$/),
  name: z.string().trim().min(2).max(160),
  countryCode: z
    .string()
    .trim()
    .length(2)
    .transform((value) => value.toUpperCase()),
  city: optionalText(100),
  contactName: optionalText(120),
  contactEmail: z.union([z.email(), z.literal("")]).optional(),
  contactPhone: optionalText(40),
  capabilities: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
});
export const updateFactorySchema = createFactorySchema.omit({ code: true });
export const factoryStatusSchema = z.object({ status: z.enum(["ACTIVE", "ON_HOLD", "INACTIVE"]) });
export function normalizeFactoryName(name: string) {
  return name
    .trim()
    .toLocaleLowerCase("en-AU")
    .replace(/[^a-z0-9\p{Script=Han}]+/gu, " ")
    .trim();
}
export function normalizeCapabilities(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}
export async function createFactory(input: z.input<typeof createFactorySchema>) {
  const data = createFactorySchema.parse(input);
  const normalizedName = normalizeFactoryName(data.name);
  const duplicate = await db.factory.findFirst({
    where: {
      OR: [
        { code: { equals: data.code, mode: "insensitive" } },
        { normalizedName, countryCode: data.countryCode },
      ],
    },
  });
  if (duplicate)
    {return { ok: false, error: "DUPLICATE_FACTORY", existingId: duplicate.id } as const;}
  const factory = await db.factory.create({
    data: {
      ...data,
      code: data.code.toUpperCase(),
      normalizedName,
      capabilities: normalizeCapabilities(data.capabilities),
    },
  });
  return { ok: true, factory } as const;
}
export async function listFactories(search = "") {
  const term = search.trim();
  return db.factory.findMany({
    where: term
      ? {
          OR: [
            { code: { contains: term, mode: "insensitive" } },
            { name: { contains: term, mode: "insensitive" } },
            { city: { contains: term, mode: "insensitive" } },
            { capabilities: { has: term } },
          ],
        }
      : {},
    orderBy: { code: "asc" },
  });
}
export async function getFactory(id: string) {
  return db.factory.findUnique({ where: { id } });
}
export async function updateFactory(
  id: string,
  input: z.input<typeof updateFactorySchema>,
  actorId: string,
) {
  const data = updateFactorySchema.parse(input);
  const existing = await db.factory.findUnique({ where: { id } });
  if (!existing) {return { ok: false, error: "FACTORY_NOT_FOUND" } as const;}
  const normalizedName = normalizeFactoryName(data.name);
  const duplicate = await db.factory.findFirst({
    where: { id: { not: id }, normalizedName, countryCode: data.countryCode },
  });
  if (duplicate)
    {return { ok: false, error: "DUPLICATE_FACTORY", existingId: duplicate.id } as const;}
  const factory = await db.$transaction(async (tx) => {
    const updated = await tx.factory.update({
      where: { id },
      data: { ...data, normalizedName, capabilities: normalizeCapabilities(data.capabilities) },
    });
    await tx.auditEvent.create({
      data: {
        actorId,
        action: "FACTORY_UPDATED",
        entityType: "Factory",
        entityId: id,
        metadata: {
          beforeName: existing.name,
          afterName: updated.name,
          capabilities: updated.capabilities,
        },
      },
    });
    return updated;
  });
  return { ok: true, factory } as const;
}
export async function setFactoryStatus(
  id: string,
  status: "ACTIVE" | "ON_HOLD" | "INACTIVE",
  actorId: string,
) {
  const existing = await db.factory.findUnique({ where: { id } });
  if (!existing) {return { ok: false, error: "FACTORY_NOT_FOUND" } as const;}
  const factory = await db.$transaction(async (tx) => {
    const updated = await tx.factory.update({ where: { id }, data: { status } });
    await tx.auditEvent.create({
      data: {
        actorId,
        action: `FACTORY_${status}`,
        entityType: "Factory",
        entityId: id,
        metadata: { before: existing.status, after: status },
      },
    });
    return updated;
  });
  return { ok: true, factory } as const;
}
export async function listFactoryAuditEvents(id: string) {
  return db.auditEvent.findMany({
    where: { entityType: "Factory", entityId: id },
    include: { actor: { select: { displayName: true, email: true } } },
    orderBy: { occurredAt: "desc" },
  });
}
