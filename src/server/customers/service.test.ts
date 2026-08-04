import { afterAll, describe, expect, it } from "vitest";
import { createCustomer, listCustomers, normalizeCustomerName } from "./service";
import { db } from "@/server/db";
const marker = `T${Date.now()}`;
afterAll(async () => {
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
});
