import Link from "next/link";
import { notFound } from "next/navigation";
import { WarehouseForm } from "@/components/warehouses/warehouse-form";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { isLocale } from "@/i18n/config";
import { authService } from "@/server/auth/auth-service";
import { listWarehouses } from "@/server/warehouses/service";
export default async function WarehousesPage({
  params,
  searchParams,
}: PageProps<"/[locale]/workspace/master-data/warehouses">) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {notFound();}
  const query = await searchParams;
  const search = typeof query.search === "string" ? query.search : "";
  const [rows, user] = await Promise.all([listWarehouses(search), authService.currentUser()]);
  const zh = raw === "zh-CN";
  return (
    <>
      <nav className="text-sm text-slate-500">
        ERP / {zh ? "基础资料 / 仓库与库位" : "Master Data / Warehouses & Locations"}
      </nav>
      <div className="mb-6 mt-3 flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{zh ? "仓库与库位" : "Warehouses & Locations"}</h1>
          <p className="mt-2 text-slate-500">
            {zh ? `共 ${rows.length} 个仓库` : `${rows.length} warehouses`}
          </p>
        </div>
        <form className="flex h-fit gap-2">
          <input name="search" defaultValue={search} className="rounded-lg border px-3 py-2" />
          <PendingSubmitButton
            idleLabel={zh ? "查询" : "Search"}
            pendingLabel={zh ? "查询中…" : "Searching…"}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white"
          />
        </form>
      </div>
      {user?.roles.includes("SYSTEM_ADMIN") && (
        <details className="mb-5">
          <summary className="mb-3 cursor-pointer font-semibold">
            ＋ {zh ? "新增仓库" : "New warehouse"}
          </summary>
          <WarehouseForm locale={raw} />
        </details>
      )}
      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              {[
                zh ? "编码" : "Code",
                zh ? "名称" : "Name",
                zh ? "地点" : "Location",
                zh ? "归属" : "Ownership",
                zh ? "库位数" : "Locations",
                zh ? "状态" : "Status",
                zh ? "操作" : "Actions",
              ].map((x) => (
                <th key={x} className="px-4 py-3">
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-4 py-3">{row.code}</td>
                <td className="px-4 py-3">{row.name}</td>
                <td className="px-4 py-3">
                  {[row.city, row.countryCode].filter(Boolean).join(", ")}
                </td>
                <td className="px-4 py-3">
                  {row.ownership}
                  {row.ownerName ? ` · ${row.ownerName}` : ""}
                </td>
                <td className="px-4 py-3">{row._count.locations}</td>
                <td className="px-4 py-3">{row.status}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/${raw}/workspace/master-data/warehouses/${row.id}`}
                    className="text-blue-600"
                  >
                    {zh ? "管理" : "Manage"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
