import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LocationForm, WarehouseForm } from "@/components/warehouses/warehouse-form";
import { isLocale } from "@/i18n/config";
import { requireSystemAdmin } from "@/server/auth/authorization";
import { getWarehouse, listWarehouseAuditEvents } from "@/server/warehouses/service";
export default async function WarehousePage({
  params,
}: PageProps<"/[locale]/workspace/master-data/warehouses/[id]">) {
  const { locale: raw, id } = await params;
  if (!isLocale(raw)) {notFound();}
  if (!(await requireSystemAdmin())) {redirect(`/${raw}/workspace/master-data/warehouses`);}
  const warehouse = await getWarehouse(id);
  if (!warehouse) {notFound();}
  const audit = await listWarehouseAuditEvents(id);
  const zh = raw === "zh-CN";
  return (
    <>
      <Link href={`/${raw}/workspace/master-data/warehouses`} className="text-sm text-blue-600">
        ← {zh ? "返回仓库列表" : "Back to warehouses"}
      </Link>
      <h1 className="mb-6 mt-4 text-3xl font-bold">
        {warehouse.code} · {warehouse.name}
      </h1>
      <WarehouseForm locale={raw} warehouse={warehouse} />
      <section className="mt-6 rounded-2xl border bg-white">
        <h2 className="border-b p-5 text-lg font-semibold">{zh ? "库位" : "Locations"}</h2>
        <LocationForm locale={raw} warehouseId={id} />
        <ul className="divide-y">
          {warehouse.locations.map((x) => (
            <li key={x.id} className="grid grid-cols-3 p-4 text-sm">
              <strong>{x.code}</strong>
              <span>{x.name ?? "—"}</span>
              <span>
                {x.zone ?? "—"} · {x.status}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-6 rounded-2xl border bg-white">
        <h2 className="border-b p-5 text-lg font-semibold">{zh ? "审计记录" : "Audit history"}</h2>
        <ul className="divide-y">
          {audit.map((x) => (
            <li key={x.id} className="grid gap-2 p-4 text-sm md:grid-cols-3">
              <time>{x.occurredAt.toLocaleString(raw)}</time>
              <strong>{x.action}</strong>
              <span>{x.actor?.displayName ?? x.actor?.email ?? "System"}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
