import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/data-table";
import { isLocale } from "@/i18n/config";
import { translate } from "@/i18n/messages";
import { listCustomers } from "@/server/customers/service";
import { notFound } from "next/navigation";
type Row = {
  code: string;
  name: string;
  countryCode: string;
  salesChannel: string | null;
  ownerName: string | null;
  status: string;
};
export default async function CustomersPage({
  params,
  searchParams,
}: PageProps<"/[locale]/workspace/master-data/customers">) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    notFound();
  }
  const locale = raw;
  const query = await searchParams;
  const search = typeof query.search === "string" ? query.search : "";
  const page = Math.max(1, Number(query.page) || 1);
  const result = await listCustomers({ search, page, pageSize: 20, sort: "code" });
  const columns: ColumnDef<Row>[] = [
    { accessorKey: "code", header: translate(locale, "masterData", "customerCode") },
    { accessorKey: "name", header: translate(locale, "masterData", "customerName") },
    { accessorKey: "countryCode", header: translate(locale, "masterData", "country") },
    { accessorKey: "salesChannel", header: translate(locale, "masterData", "channel") },
    { accessorKey: "ownerName", header: translate(locale, "masterData", "owner") },
    { accessorKey: "status", header: translate(locale, "masterData", "status") },
  ];
  const base = `/${locale}/workspace/master-data/customers`;
  return (
    <>
      <nav className="text-sm text-slate-500">
        ERP / {translate(locale, "masterData", "customers")}
      </nav>
      <div className="mb-6 mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{translate(locale, "masterData", "customers")}</h1>
          <p className="mt-2 text-slate-500">
            {locale === "zh-CN"
              ? `共 ${result.total} 个客户，数据来自 PostgreSQL。`
              : `${result.total} customers from PostgreSQL.`}
          </p>
        </div>
        <form className="flex gap-2">
          <input
            name="search"
            defaultValue={search}
            placeholder={translate(locale, "shell", "search")}
            className="rounded-lg border px-3 py-2"
          />
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-white">
            {locale === "zh-CN" ? "查询" : "Search"}
          </button>
        </form>
      </div>
      <DataTable
        data={result.data}
        columns={columns}
        labels={{
          search: translate(locale, "shell", "search"),
          columns: translate(locale, "shell", "columns"),
          previous: translate(locale, "shell", "previous"),
          next: translate(locale, "shell", "next"),
          empty: translate(locale, "shell", "empty"),
        }}
      />
      <div className="mt-4 flex justify-end gap-2">
        <Link
          aria-disabled={page <= 1}
          href={`${base}?search=${encodeURIComponent(search)}&page=${Math.max(1, page - 1)}`}
          className={`rounded-lg border px-3 py-2 text-sm ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
        >
          {translate(locale, "shell", "previous")}
        </Link>
        <span className="px-3 py-2 text-sm">
          {result.page} / {result.pageCount}
        </span>
        <Link
          aria-disabled={page >= result.pageCount}
          href={`${base}?search=${encodeURIComponent(search)}&page=${Math.min(result.pageCount, page + 1)}`}
          className={`rounded-lg border px-3 py-2 text-sm ${page >= result.pageCount ? "pointer-events-none opacity-40" : ""}`}
        >
          {translate(locale, "shell", "next")}
        </Link>
      </div>
    </>
  );
}
