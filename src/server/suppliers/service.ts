import "server-only";
import { z } from "zod";
import { db } from "@/server/db";

const optionalText = (max: number) => z.string().trim().max(max).optional();
export const createSupplierSchema = z.object({
  code: z.string().trim().min(2).max(30).regex(/^[A-Za-z0-9_-]+$/),
  name: z.string().trim().min(2).max(160),
  countryCode: z.string().trim().length(2).transform((value) => value.toUpperCase()),
  category: optionalText(80),
  contactName: optionalText(120),
  contactEmail: z.union([z.email(), z.literal("")]).optional(),
  contactPhone: optionalText(40),
});
export const updateSupplierSchema = createSupplierSchema.omit({ code: true });
export const supplierStatusSchema = z.object({ status: z.enum(["ACTIVE", "SUSPENDED", "INACTIVE"]) });
export const certificationSchema = z.object({
  certificationType: z.string().trim().min(2).max(100),
  certificateNumber: optionalText(100),
  issuedBy: optionalText(160),
  validFrom: z.coerce.date().optional(),
  expiresAt: z.coerce.date(),
});

export function normalizeSupplierName(name: string) {
  return name.trim().toLocaleLowerCase("en-AU").replace(/[^a-z0-9\p{Script=Han}]+/gu, " ").trim();
}
export function certificationStatus(expiresAt: Date, now = new Date()) {
  const days = Math.ceil((expiresAt.getTime() - now.getTime()) / 86_400_000);
  return days < 0 ? "EXPIRED" : days <= 60 ? "EXPIRING" : "VALID";
}
export async function createSupplier(input: z.input<typeof createSupplierSchema>) {
  const data = createSupplierSchema.parse(input);
  const normalizedName = normalizeSupplierName(data.name);
  const duplicate = await db.supplier.findFirst({ where: { OR: [
    { code: { equals: data.code, mode: "insensitive" } },
    { normalizedName, countryCode: data.countryCode },
  ] } });
  if (duplicate) {return { ok: false, error: "DUPLICATE_SUPPLIER", existingId: duplicate.id } as const;}
  const supplier = await db.supplier.create({ data: { ...data, code: data.code.toUpperCase(), normalizedName } });
  return { ok: true, supplier } as const;
}
export async function listSuppliers(search = "") {
  const term = search.trim();
  const data = await db.supplier.findMany({
    where: term ? { OR: [
      { code: { contains: term, mode: "insensitive" } },
      { name: { contains: term, mode: "insensitive" } },
      { category: { contains: term, mode: "insensitive" } },
    ] } : {},
    include: { certifications: { orderBy: { expiresAt: "asc" } } },
    orderBy: { code: "asc" },
  });
  return data.map((supplier) => ({ ...supplier, certifications: supplier.certifications.map((item) => ({ ...item, derivedStatus: certificationStatus(item.expiresAt) })) }));
}
export async function getSupplier(id: string) {
  return db.supplier.findUnique({ where: { id }, include: { certifications: { orderBy: { expiresAt: "asc" } } } });
}
export async function updateSupplier(id: string, input: z.input<typeof updateSupplierSchema>, actorId: string) {
  const data = updateSupplierSchema.parse(input);
  const existing = await db.supplier.findUnique({ where: { id } });
  if (!existing) {return { ok: false, error: "SUPPLIER_NOT_FOUND" } as const;}
  const normalizedName = normalizeSupplierName(data.name);
  const duplicate = await db.supplier.findFirst({ where: { id: { not: id }, normalizedName, countryCode: data.countryCode } });
  if (duplicate) {return { ok: false, error: "DUPLICATE_SUPPLIER", existingId: duplicate.id } as const;}
  const supplier = await db.$transaction(async (tx) => {
    const updated = await tx.supplier.update({ where: { id }, data: { ...data, normalizedName } });
    await tx.auditEvent.create({ data: { actorId, action: "SUPPLIER_UPDATED", entityType: "Supplier", entityId: id, metadata: { beforeId: existing.id, beforeName: existing.name, afterName: updated.name } } });
    return updated;
  });
  return { ok: true, supplier } as const;
}
export async function setSupplierStatus(id: string, status: "ACTIVE" | "SUSPENDED" | "INACTIVE", actorId: string) {
  const existing = await db.supplier.findUnique({ where: { id } });
  if (!existing) {return { ok: false, error: "SUPPLIER_NOT_FOUND" } as const;}
  const supplier = await db.$transaction(async (tx) => {
    const updated = await tx.supplier.update({ where: { id }, data: { status } });
    await tx.auditEvent.create({ data: { actorId, action: `SUPPLIER_${status}`, entityType: "Supplier", entityId: id, metadata: { before: existing.status, after: status } } });
    return updated;
  });
  return { ok: true, supplier } as const;
}
export async function addSupplierCertification(id: string, input: z.input<typeof certificationSchema>, actorId: string) {
  const data = certificationSchema.parse(input);
  if (data.validFrom && data.expiresAt <= data.validFrom) {return { ok: false, error: "INVALID_CERTIFICATION_DATES" } as const;}
  if (!(await db.supplier.findUnique({ where: { id }, select: { id: true } }))) {return { ok: false, error: "SUPPLIER_NOT_FOUND" } as const;}
  const certification = await db.$transaction(async (tx) => {
    const created = await tx.supplierCertification.create({ data: { supplierId: id, ...data } });
    await tx.auditEvent.create({ data: { actorId, action: "SUPPLIER_CERTIFICATION_ADDED", entityType: "Supplier", entityId: id, metadata: { certificationId: created.id, type: created.certificationType, expiresAt: created.expiresAt.toISOString() } } });
    return created;
  });
  return { ok: true, certification } as const;
}
export async function listSupplierAuditEvents(id: string) {
  return db.auditEvent.findMany({ where: { entityType: "Supplier", entityId: id }, include: { actor: { select: { displayName: true, email: true } } }, orderBy: { occurredAt: "desc" } });
}
