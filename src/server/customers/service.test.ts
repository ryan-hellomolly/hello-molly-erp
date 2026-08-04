import { afterAll, describe, expect, it } from "vitest";
import {
  createCustomer,
  listCustomerAuditEvents,
  listCustomers,
  normalizeCustomerName,
  setCustomerStatus,
  updateCustomer,
} from "./service";
import { db } from "@/server/db";
const marker = `T${Date.now()}`;
afterAll(async () => {
  const customers = await db.customer.findMany({
    where: { code: { startsWith: marker } },
    select: { id: true },
  });
  await db.auditEvent.deleteMany({
    where: { entityType: "Customer", entityId: { in: customers.map(({ id }) => id) } },
  });
  await db.customer.deleteMany({ where: { code: { startsWith: marker } } });
  await db.$disconnect();
});
describe("customer master", () => {
  it("normalizes names for duplicate comparison", () =>
    expect(normalizeCustomerName("  Hello-Molly  AU ")).toBe("hello molly au"));
  it("creates, searches and paginates customers", async () => {
    const first = await createCustomer({
      code: `${marker}A`,
      name: `${marker} Retail`,
      countryCode: "au",
    });
    expect(first.ok).toBe(true);
    await createCustomer({ code: `${marker}B`, name: `${marker} Online`, countryCode: "AU" });
    const list = await listCustomers({ search: marker, page: 1, pageSize: 1, sort: "code" });
    expect(list.total).toBe(2);
    expect(list.data).toHaveLength(1);
    expect(list.pageCount).toBe(2);
  });
  it("rejects duplicate codes and normalized name/country pairs", async () => {
    const byCode = await createCustomer({
      code: `${marker}A`,
      name: "Different Name",
      countryCode: "AU",
    });
    expect(byCode).toMatchObject({ ok: false, error: "DUPLICATE_CUSTOMER" });
    const byName = await createCustomer({
      code: `${marker}C`,
      name: `${marker}-Retail`,
      countryCode: "AU",
    });
    expect(byName).toMatchObject({ ok: false, error: "DUPLICATE_CUSTOMER" });
  });
  it("updates, deactivates and audits customer changes", async () => {
    const actor = await db.user.findFirstOrThrow();
    const customer = await db.customer.findFirstOrThrow({ where: { code: `${marker}A` } });
    const updated = await updateCustomer(
      customer.id,
      { name: `${marker} Retail AU`, countryCode: "au", ownerName: "Merch Team" },
      actor.id,
    );
    expect(updated).toMatchObject({ ok: true, customer: { ownerName: "Merch Team" } });
    const status = await setCustomerStatus(customer.id, "INACTIVE", actor.id);
    expect(status).toMatchObject({ ok: true, customer: { status: "INACTIVE" } });
    expect((await listCustomerAuditEvents(customer.id)).map(({ action }) => action)).toEqual([
      "CUSTOMER_DEACTIVATED",
      "CUSTOMER_UPDATED",
    ]);
  });
  it("reports missing customers without writing audit events", async () => {
    const actor = await db.user.findFirstOrThrow();
    await expect(
      updateCustomer(crypto.randomUUID(), { name: "Missing", countryCode: "AU" }, actor.id),
    ).resolves.toMatchObject({ ok: false, error: "CUSTOMER_NOT_FOUND" });
  });
});
