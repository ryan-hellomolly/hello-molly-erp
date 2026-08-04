import "server-only";
import { z } from "zod";
import { db } from "@/server/db";

export const deliveryAddressSchema = z.object({
  address: z.string().trim().min(3).max(500),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(0),
});
export const cashierAccountSchema = z.object({
  name: z.string().trim().min(1).max(160),
  routingNumber: z.string().trim().max(60).optional(),
  accountNumber: z.string().trim().min(2).max(100),
  currency: z
    .string()
    .trim()
    .length(3)
    .transform((value) => value.toUpperCase()),
  address: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(1000).optional(),
  qrCodeUrl: z.string().trim().max(500).optional(),
});
async function audit(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata: object,
) {
  await db.auditEvent.create({ data: { actorId, action, entityType, entityId, metadata } });
}
export const listDeliveryAddresses = () =>
  db.deliveryAddress.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
export async function saveDeliveryAddress(
  id: string | null,
  input: z.input<typeof deliveryAddressSchema>,
  actorId: string,
) {
  const data = deliveryAddressSchema.parse(input);
  const row = id
    ? await db.deliveryAddress.update({ where: { id }, data })
    : await db.deliveryAddress.create({ data });
  await audit(
    actorId,
    id ? "DELIVERY_ADDRESS_UPDATED" : "DELIVERY_ADDRESS_CREATED",
    "DeliveryAddress",
    row.id,
    data,
  );
  return row;
}
export async function deleteDeliveryAddress(id: string, actorId: string) {
  const row = await db.deliveryAddress.findUnique({ where: { id } });
  if (!row) {return false;}
  await db.$transaction(async (tx) => {
    await tx.auditEvent.create({
      data: {
        actorId,
        action: "DELIVERY_ADDRESS_DELETED",
        entityType: "DeliveryAddress",
        entityId: id,
        metadata: { address: row.address },
      },
    });
    await tx.deliveryAddress.delete({ where: { id } });
  });
  return true;
}
export const listCashierAccounts = () => db.cashierAccount.findMany({ orderBy: { name: "asc" } });
export async function saveCashierAccount(
  id: string | null,
  input: z.input<typeof cashierAccountSchema>,
  actorId: string,
) {
  const data = cashierAccountSchema.parse(input);
  const row = id
    ? await db.cashierAccount.update({ where: { id }, data })
    : await db.cashierAccount.create({ data });
  await audit(
    actorId,
    id ? "CASHIER_ACCOUNT_UPDATED" : "CASHIER_ACCOUNT_CREATED",
    "CashierAccount",
    row.id,
    { name: row.name, currency: row.currency },
  );
  return row;
}
export async function deleteCashierAccount(id: string, actorId: string) {
  const row = await db.cashierAccount.findUnique({ where: { id } });
  if (!row) {return false;}
  await db.$transaction(async (tx) => {
    await tx.auditEvent.create({
      data: {
        actorId,
        action: "CASHIER_ACCOUNT_DELETED",
        entityType: "CashierAccount",
        entityId: id,
        metadata: { name: row.name },
      },
    });
    await tx.cashierAccount.delete({ where: { id } });
  });
  return true;
}
