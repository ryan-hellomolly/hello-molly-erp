import Link from "next/link";
import { notFound } from "next/navigation";
import { SupplierCreateForm } from "@/components/suppliers/supplier-create-form";
import { isLocale } from "@/i18n/config";
import { listSuppliers } from "@/server/suppliers/service";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";

export default async function SuppliersPage({
  params,
  searchParams,
}: PageProps<"/[locale]/workspace/master-data/suppliers">) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    notFound();
  }
  const query = await searchParams;
  const search = typeof query.search === "string" ? query.search : "";
  const suppliers = await listSuppliers(search);
  const zh = raw === "zh-CN";
  return (
    <>
      <nav className="text-sm text-slate-500">
        ERP / {zh ? "基础资料 / 供应商" : "Master Data / Suppliers"}
      </nav>
      <div className="mb-6 mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{zh ? "供应商" : "Suppliers"}</h1>
          <p className="mt-2 text-slate-500">
            {zh ? `共 ${suppliers.length} 个供应商` : `${suppliers.length} suppliers`}
          </p>
        </div>
        <form className="flex gap-2">
          <input
            name="search"
            defaultValue={search}
            placeholder={zh ? "编码、名称或类别" : "Code, name or category"}
            className="rounded-lg border px-3 py-2"
          />
          <PendingSubmitButton
            idleLabel={zh ? "查询" : "Search"}
            pendingLabel={zh ? "查询中…" : "Searching…"}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white"
          />
        </form>
      </div>
      <SupplierCreateForm locale={raw} />
      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {[
                zh ? "编码" : "Code",
                zh ? "名称" : "Name",
                zh ? "国家" : "Country",
                zh ? "类别" : "Category",
                zh ? "状态" : "Status",
                zh ? "认证" : "Certifications",
                zh ? "操作" : "Actions",
              ].map((label) => (
                <th key={label} className="px-4 py-3">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id} className="border-t">
                <td className="px-4 py-3 font-medium">{supplier.code}</td>
                <td className="px-4 py-3">{supplier.name}</td>
                <td className="px-4 py-3">{supplier.countryCode}</td>
                <td className="px-4 py-3">{supplier.category ?? "—"}</td>
                <td className="px-4 py-3">{supplier.status}</td>
                <td className="px-4 py-3">
                  {supplier.certifications.length
                    ? supplier.certifications.map((item) => item.derivedStatus).join(" / ")
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/${raw}/workspace/master-data/suppliers/${supplier.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {zh ? "管理" : "Manage"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!suppliers.length && (
          <p className="p-10 text-center text-sm text-slate-500">
            {zh ? "暂无供应商" : "No suppliers"}
          </p>
        )}
      </div>
    </>
  );
}
