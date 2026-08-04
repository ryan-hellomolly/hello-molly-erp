import Link from "next/link";
import { CustomerTable } from "@/components/customers/customer-table";
import { isLocale } from "@/i18n/config";
import { translate } from "@/i18n/messages";
import { listCustomers } from "@/server/customers/service";
import { notFound } from "next/navigation";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { CustomerCreateForm } from "@/components/customers/customer-create-form";
import { authService } from "@/server/auth/auth-service";
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
  const [result, user] = await Promise.all([
    listCustomers({ search, page, pageSize: 20, sort: "code" }),
    authService.currentUser(),
  ]);
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
          <PendingSubmitButton
            idleLabel={locale === "zh-CN" ? "查询" : "Search"}
            pendingLabel={locale === "zh-CN" ? "查询中…" : "Searching…"}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white"
          />
        </form>
      </div>
      {user?.roles.includes("SYSTEM_ADMIN") && <CustomerCreateForm locale={locale} />}
      <CustomerTable data={result.data} locale={locale} />
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
