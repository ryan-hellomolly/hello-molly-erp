import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import {
  addSupplierCertification,
  certificationStatus,
  createSupplier,
  listSupplierAuditEvents,
  listSuppliers,
  normalizeSupplierName,
  setSupplierStatus,
  updateSupplier,
} from "./service";

const marker = `S${Date.now()}`;
afterAll(async () => {
  const suppliers = await db.supplier.findMany({
    where: { code: { startsWith: marker } },
    select: { id: true },
  });
  await db.auditEvent.deleteMany({
    where: { entityType: "Supplier", entityId: { in: suppliers.map(({ id }) => id) } },
  });
  await db.supplier.deleteMany({ where: { id: { in: suppliers.map(({ id }) => id) } } });
  await db.$disconnect();
});
describe("supplier master", () => {
  it("normalizes names and derives certification status", () => {
    expect(normalizeSupplierName(" Molly-Supply  CN ")).toBe("molly supply cn");
    expect(certificationStatus(new Date("2026-01-01"), new Date("2026-08-01"))).toBe("EXPIRED");
    expect(certificationStatus(new Date("2026-08-30"), new Date("2026-08-01"))).toBe("EXPIRING");
    expect(certificationStatus(new Date("2027-08-01"), new Date("2026-08-01"))).toBe("VALID");
  });
  it("creates, finds and rejects duplicate suppliers", async () => {
    const created = await createSupplier({
      code: `${marker}A`,
      name: `${marker} Textiles`,
      countryCode: "cn",
    });
    expect(created.ok).toBe(true);
    expect(await listSuppliers(marker)).toHaveLength(1);
    await expect(
      createSupplier({ code: `${marker}A`, name: "Other", countryCode: "AU" }),
    ).resolves.toMatchObject({ ok: false, error: "DUPLICATE_SUPPLIER" });
    await expect(
      createSupplier({ code: `${marker}B`, name: `${marker}-Textiles`, countryCode: "CN" }),
    ).resolves.toMatchObject({ ok: false, error: "DUPLICATE_SUPPLIER" });
  });
  it("updates status, certification and audit history", async () => {
    const actor = await db.user.findFirstOrThrow();
    const supplier = await db.supplier.findFirstOrThrow({ where: { code: `${marker}A` } });
    expect(
      await updateSupplier(
        supplier.id,
        { name: `${marker} Fabric`, countryCode: "CN", category: "Fabric" },
        actor.id,
      ),
    ).toMatchObject({ ok: true });
    expect(await setSupplierStatus(supplier.id, "SUSPENDED", actor.id)).toMatchObject({
      ok: true,
      supplier: { status: "SUSPENDED" },
    });
    expect(
      await addSupplierCertification(
        supplier.id,
        { certificationType: "BSCI", validFrom: "2026-01-01", expiresAt: "2027-01-01" },
        actor.id,
      ),
    ).toMatchObject({ ok: true });
    expect((await listSupplierAuditEvents(supplier.id)).map(({ action }) => action)).toEqual([
      "SUPPLIER_CERTIFICATION_ADDED",
      "SUPPLIER_SUSPENDED",
      "SUPPLIER_UPDATED",
    ]);
  });
  it("rejects invalid certification dates and missing suppliers", async () => {
    const actor = await db.user.findFirstOrThrow();
    const id = crypto.randomUUID();
    await expect(
      addSupplierCertification(
        id,
        { certificationType: "BSCI", validFrom: "2027-01-01", expiresAt: "2026-01-01" },
        actor.id,
      ),
    ).resolves.toMatchObject({ ok: false, error: "INVALID_CERTIFICATION_DATES" });
    await expect(setSupplierStatus(id, "INACTIVE", actor.id)).resolves.toMatchObject({
      ok: false,
      error: "SUPPLIER_NOT_FOUND",
    });
  });
});
