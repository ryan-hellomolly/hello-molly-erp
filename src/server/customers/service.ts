import "server-only";
import { z } from "zod";
import { db } from "@/server/db";

export const createCustomerSchema = z.object({
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
  salesChannel: z.string().trim().max(80).optional(),
  ownerName: z.string().trim().max(120).optional(),
});
export type CustomerInput = z.infer<typeof createCustomerSchema>;
export const updateCustomerSchema = createCustomerSchema.omit({ code: true });
export type CustomerUpdateInput = z.infer<typeof updateCustomerSchema>;
export const customerStatusSchema = z.object({ status: z.enum(["ACTIVE", "INACTIVE"]) });
export function normalizeCustomerName(name: string) {
  return name
    .trim()
    .toLocaleLowerCase("en-AU")
    .replace(/[^a-z0-9\p{Script=Han}]+/gu, " ")
    .trim();
}
export async function createCustomer(input: CustomerInput) {
  const data = createCustomerSchema.parse(input);
  const duplicate = await db.customer.findFirst({
    where: {
      OR: [
        { code: { equals: data.code, mode: "insensitive" } },
        { normalizedName: normalizeCustomerName(data.name), countryCode: data.countryCode },
      ],
    },
  });
  if (duplicate) {
    return { ok: false, error: "DUPLICATE_CUSTOMER", existingId: duplicate.id } as const;
  }
  const customer = await db.customer.create({
    data: {
      ...data,
      code: data.code.toUpperCase(),
      normalizedName: normalizeCustomerName(data.name),
    },
  });
  return { ok: true, customer } as const;
}
export async function getCustomer(id: string) {
  return db.customer.findUnique({ where: { id } });
}
export async function updateCustomer(id: string, input: CustomerUpdateInput, actorId: string) {
  const data = updateCustomerSchema.parse(input);
  const existing = await db.customer.findUnique({ where: { id } });
  if (!existing) {return { ok: false, error: "CUSTOMER_NOT_FOUND" } as const;}
  const normalizedName = normalizeCustomerName(data.name);
  const duplicate = await db.customer.findFirst({
    where: { id: { not: id }, normalizedName, countryCode: data.countryCode },
  });
  if (duplicate) {
    return { ok: false, error: "DUPLICATE_CUSTOMER", existingId: duplicate.id } as const;
  }
  const customer = await db.$transaction(async (tx) => {
    const updated = await tx.customer.update({
      where: { id },
      data: { ...data, normalizedName },
    });
    await tx.auditEvent.create({
      data: {
        actorId,
        action: "CUSTOMER_UPDATED",
        entityType: "Customer",
        entityId: id,
        metadata: { before: existing, after: updated },
      },
    });
    return updated;
  });
  return { ok: true, customer } as const;
}
export async function setCustomerStatus(id: string, status: "ACTIVE" | "INACTIVE", actorId: string) {
  const existing = await db.customer.findUnique({ where: { id } });
  if (!existing) {return { ok: false, error: "CUSTOMER_NOT_FOUND" } as const;}
  if (existing.status === status) {return { ok: true, customer: existing } as const;}
  const customer = await db.$transaction(async (tx) => {
    const updated = await tx.customer.update({ where: { id }, data: { status } });
    await tx.auditEvent.create({
      data: {
        actorId,
        action: status === "ACTIVE" ? "CUSTOMER_ACTIVATED" : "CUSTOMER_DEACTIVATED",
        entityType: "Customer",
        entityId: id,
        metadata: { before: { status: existing.status }, after: { status } },
      },
    });
    return updated;
  });
  return { ok: true, customer } as const;
}
export async function listCustomerAuditEvents(id: string) {
  return db.auditEvent.findMany({
    where: { entityType: "Customer", entityId: id },
    include: { actor: { select: { displayName: true, email: true } } },
    orderBy: { occurredAt: "desc" },
  });
}
const sortFields = {
  code: "code",
  name: "name",
  countryCode: "countryCode",
  createdAt: "createdAt",
} as const;
export async function listCustomers({
  page = 1,
  pageSize = 20,
  search = "",
  sort = "name",
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
          { name: { contains: term, mode: "insensitive" as const } },
          { countryCode: { contains: term, mode: "insensitive" as const } },
        ],
      }
    : {};
  const [data, total] = await Promise.all([
    db.customer.findMany({
      where,
      orderBy: { [sortFields[sort]]: direction },
      skip: (safePage - 1) * safeSize,
      take: safeSize,
    }),
    db.customer.count({ where }),
  ]);
  return {
    data,
    total,
    page: safePage,
    pageSize: safeSize,
    pageCount: Math.max(1, Math.ceil(total / safeSize)),
  };
}
