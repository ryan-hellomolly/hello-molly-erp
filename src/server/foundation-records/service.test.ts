import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import {
  deleteCashierAccount,
  deleteDeliveryAddress,
  listCashierAccounts,
  listDeliveryAddresses,
  saveCashierAccount,
  saveDeliveryAddress,
} from "./service";
const marker = `F${Date.now()}`;
const ids: string[] = [];
afterAll(async () => {
  await db.auditEvent.deleteMany({ where: { entityId: { in: ids } } });
  await db.deliveryAddress.deleteMany({ where: { id: { in: ids } } });
  await db.cashierAccount.deleteMany({ where: { id: { in: ids } } });
  await db.$disconnect();
});
describe("foundation records", () => {
  it("creates, updates and deletes delivery addresses with audit", async () => {
    const actor = await db.user.findFirstOrThrow();
    const created = await saveDeliveryAddress(null, { address: `${marker} Sydney` }, actor.id);
    ids.push(created.id);
    expect((await listDeliveryAddresses()).some(({ id }) => id === created.id)).toBe(true);
    const updated = await saveDeliveryAddress(
      created.id,
      { address: `${marker} Melbourne` },
      actor.id,
    );
    expect(updated.address).toContain("Melbourne");
    expect(await deleteDeliveryAddress(created.id, actor.id)).toBe(true);
    expect(await deleteDeliveryAddress(created.id, actor.id)).toBe(false);
  });
  it("creates, updates and deletes cashier accounts", async () => {
    const actor = await db.user.findFirstOrThrow();
    const created = await saveCashierAccount(
      null,
      {
        name: `${marker} Account`,
        accountNumber: marker,
        currency: "aud",
        routingNumber: "062000",
      },
      actor.id,
    );
    ids.push(created.id);
    expect(created.currency).toBe("AUD");
    expect((await listCashierAccounts()).some(({ id }) => id === created.id)).toBe(true);
    const updated = await saveCashierAccount(
      created.id,
      { name: `${marker} Updated`, accountNumber: marker, currency: "AUD" },
      actor.id,
    );
    expect(updated.name).toContain("Updated");
    expect(await deleteCashierAccount(created.id, actor.id)).toBe(true);
    expect(await deleteCashierAccount(created.id, actor.id)).toBe(false);
  });
});
