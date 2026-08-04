import "server-only";
import { z } from "zod";
import { db } from "@/server/db";
const optionalText = (max: number) => z.string().trim().max(max).optional();
const warehouseFields = z.object({
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
    .transform((x) => x.toUpperCase()),
  city: optionalText(100),
  address: optionalText(240),
  ownership: z.enum(["HELLO_MOLLY", "THIRD_PARTY", "FACTORY", "SUPPLIER"]),
  ownerName: optionalText(160),
});
const requireExternalOwner = <T extends { ownership: string; ownerName?: string }>(
  data: T,
  ctx: z.RefinementCtx,
) => {
  if (data.ownership !== "HELLO_MOLLY" && !data.ownerName) {
    ctx.addIssue({
      code: "custom",
      path: ["ownerName"],
      message: "Owner name is required for external ownership",
    });
  }
};
export const createWarehouseSchema = warehouseFields.superRefine(requireExternalOwner);
export const updateWarehouseSchema = warehouseFields
  .omit({ code: true })
  .superRefine(requireExternalOwner);
export const warehouseStatusSchema = z.object({ status: z.enum(["ACTIVE", "INACTIVE"]) });
export const locationSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/),
  name: optionalText(120),
  zone: optionalText(80),
});
export async function createWarehouse(input: z.input<typeof createWarehouseSchema>) {
  const data = createWarehouseSchema.parse(input);
  const duplicate = await db.warehouse.findFirst({
    where: { code: { equals: data.code, mode: "insensitive" } },
  });
  if (duplicate) {
    return { ok: false, error: "DUPLICATE_WAREHOUSE", existingId: duplicate.id } as const;
  }
  const warehouse = await db.warehouse.create({ data: { ...data, code: data.code.toUpperCase() } });
  return { ok: true, warehouse } as const;
}
export async function listWarehouses(search = "") {
  const term = search.trim();
  return db.warehouse.findMany({
    where: term
      ? {
          OR: [
            { code: { contains: term, mode: "insensitive" } },
            { name: { contains: term, mode: "insensitive" } },
            { city: { contains: term, mode: "insensitive" } },
          ],
        }
      : {},
    include: { _count: { select: { locations: true } } },
    orderBy: { code: "asc" },
  });
}
export async function getWarehouse(id: string) {
  return db.warehouse.findUnique({
    where: { id },
    include: { locations: { orderBy: { code: "asc" } } },
  });
}
export async function updateWarehouse(
  id: string,
  input: z.input<typeof updateWarehouseSchema>,
  actorId: string,
) {
  const data = updateWarehouseSchema.parse(input);
  const existing = await db.warehouse.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false, error: "WAREHOUSE_NOT_FOUND" } as const;
  }
  const warehouse = await db.$transaction(async (tx) => {
    const updated = await tx.warehouse.update({ where: { id }, data });
    await tx.auditEvent.create({
      data: {
        actorId,
        action: "WAREHOUSE_UPDATED",
        entityType: "Warehouse",
        entityId: id,
        metadata: {
          beforeName: existing.name,
          afterName: updated.name,
          ownership: updated.ownership,
        },
      },
    });
    return updated;
  });
  return { ok: true, warehouse } as const;
}
export async function setWarehouseStatus(
  id: string,
  status: "ACTIVE" | "INACTIVE",
  actorId: string,
) {
  const existing = await db.warehouse.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false, error: "WAREHOUSE_NOT_FOUND" } as const;
  }
  const warehouse = await db.$transaction(async (tx) => {
    const updated = await tx.warehouse.update({ where: { id }, data: { status } });
    await tx.auditEvent.create({
      data: {
        actorId,
        action: `WAREHOUSE_${status}`,
        entityType: "Warehouse",
        entityId: id,
        metadata: { before: existing.status, after: status },
      },
    });
    return updated;
  });
  return { ok: true, warehouse } as const;
}
export async function addWarehouseLocation(
  id: string,
  input: z.input<typeof locationSchema>,
  actorId: string,
) {
  const data = locationSchema.parse(input);
  if (!(await db.warehouse.findUnique({ where: { id }, select: { id: true } }))) {
    return { ok: false, error: "WAREHOUSE_NOT_FOUND" } as const;
  }
  const duplicate = await db.warehouseLocation.findUnique({
    where: { warehouseId_code: { warehouseId: id, code: data.code.toUpperCase() } },
  });
  if (duplicate) {
    return { ok: false, error: "DUPLICATE_LOCATION" } as const;
  }
  const location = await db.$transaction(async (tx) => {
    const created = await tx.warehouseLocation.create({
      data: { warehouseId: id, ...data, code: data.code.toUpperCase() },
    });
    await tx.auditEvent.create({
      data: {
        actorId,
        action: "WAREHOUSE_LOCATION_ADDED",
        entityType: "Warehouse",
        entityId: id,
        metadata: { locationId: created.id, code: created.code },
      },
    });
    return created;
  });
  return { ok: true, location } as const;
}
export async function listWarehouseAuditEvents(id: string) {
  return db.auditEvent.findMany({
    where: { entityType: "Warehouse", entityId: id },
    include: { actor: { select: { displayName: true, email: true } } },
    orderBy: { occurredAt: "desc" },
  });
}
