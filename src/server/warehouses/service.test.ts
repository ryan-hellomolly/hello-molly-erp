import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import {
  addWarehouseLocation,
  createWarehouse,
  createWarehouseSchema,
  listWarehouseAuditEvents,
  listWarehouses,
  setWarehouseStatus,
  updateWarehouse,
} from "./service";
const marker = `W${Date.now()}`;
afterAll(async () => {
  const rows = await db.warehouse.findMany({
    where: { code: { startsWith: marker } },
    select: { id: true },
  });
  const ids = rows.map(({ id }) => id);
  await db.auditEvent.deleteMany({ where: { entityType: "Warehouse", entityId: { in: ids } } });
  await db.warehouseLocation.deleteMany({ where: { warehouseId: { in: ids } } });
  await db.warehouse.deleteMany({ where: { id: { in: ids } } });
  await db.$disconnect();
});
describe("warehouse master", () => {
  it("requires an owner for external warehouses", () => {
    expect(
      createWarehouseSchema.safeParse({
        code: "EXT",
        name: "External",
        countryCode: "CN",
        ownership: "THIRD_PARTY",
      }).success,
    ).toBe(false);
    expect(
      createWarehouseSchema.safeParse({
        code: "HM",
        name: "Hello Molly",
        countryCode: "AU",
        ownership: "HELLO_MOLLY",
      }).success,
    ).toBe(true);
  });
  it("creates, lists and rejects duplicate warehouses", async () => {
    expect(
      await createWarehouse({
        code: `${marker}A`,
        name: "Sydney DC",
        countryCode: "au",
        ownership: "HELLO_MOLLY",
      }),
    ).toMatchObject({ ok: true });
    expect(await listWarehouses(marker)).toHaveLength(1);
    expect(
      await createWarehouse({
        code: `${marker}A`,
        name: "Other",
        countryCode: "CN",
        ownership: "FACTORY",
        ownerName: "Factory A",
      }),
    ).toMatchObject({ ok: false, error: "DUPLICATE_WAREHOUSE" });
  });
  it("updates ownership, adds unique locations and audits", async () => {
    const actor = await db.user.findFirstOrThrow();
    const row = await db.warehouse.findFirstOrThrow({ where: { code: `${marker}A` } });
    expect(
      await updateWarehouse(
        row.id,
        {
          name: "Sydney DC",
          countryCode: "AU",
          city: "Sydney",
          ownership: "THIRD_PARTY",
          ownerName: "3PL AU",
        },
        actor.id,
      ),
    ).toMatchObject({ ok: true });
    expect(await addWarehouseLocation(row.id, { code: "A-01", zone: "A" }, actor.id)).toMatchObject(
      { ok: true },
    );
    expect(await addWarehouseLocation(row.id, { code: "A-01" }, actor.id)).toMatchObject({
      ok: false,
      error: "DUPLICATE_LOCATION",
    });
    expect(await setWarehouseStatus(row.id, "INACTIVE", actor.id)).toMatchObject({
      ok: true,
      warehouse: { status: "INACTIVE" },
    });
    expect((await listWarehouseAuditEvents(row.id)).map(({ action }) => action)).toEqual([
      "WAREHOUSE_INACTIVE",
      "WAREHOUSE_LOCATION_ADDED",
      "WAREHOUSE_UPDATED",
    ]);
  });
});
