import Link from "next/link";
import { notFound } from "next/navigation";
import { StyleTable } from "@/components/styles/style-table";
import { isLocale } from "@/i18n/config";
import { authService } from "@/server/auth/auth-service";
import { listStyles } from "@/server/styles/service";

export default async function StylesPage({
  params,
  searchParams,
}: PageProps<"/[locale]/workspace/style-design/styles">) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    notFound();
  }
  const locale = raw;
  const query = await searchParams;
  const search = typeof query.search === "string" ? query.search : "";
  const page = Math.max(1, Number(query.page) || 1);
  const [result, user] = await Promise.all([
    listStyles({ search, page, pageSize: 20, sort: "code" }),
    authService.currentUser(),
  ]);
  const zh = locale === "zh-CN";
  const base = `/${locale}/workspace/style-design/styles`;
  return (
    <>
      <nav className="text-sm text-slate-500">
        ERP / {zh ? "款式设计 / 款式档案" : "Style Design / Style Records"}
      </nav>
      <div className="mb-6 mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{zh ? "款式档案" : "Style Records"}</h1>
          <p className="mt-2 text-slate-500">
            {zh
              ? `共 ${result.total} 个款式，数据来自 PostgreSQL。`
              : `${result.total} styles from PostgreSQL.`}
          </p>
        </div>
        <div className="flex items-end gap-2">
          <form className="flex gap-2">
            <input
              name="search"
              defaultValue={search}
              placeholder={zh ? "查询" : "Search"}
              className="rounded-lg border px-3 py-2"
            />
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-white">
              {zh ? "查询" : "Search"}
            </button>
          </form>
          {user?.roles.includes("SYSTEM_ADMIN") && (
            <Link
              href={`${base}/new`}
              className="rounded-lg border px-4 py-2 font-medium text-blue-600 hover:bg-slate-50"
            >
              ＋ {zh ? "新增款式" : "New style"}
            </Link>
          )}
        </div>
      </div>
      <StyleTable data={result.data} locale={locale} />
      <div className="mt-4 flex justify-end gap-2">
        <Link
          aria-disabled={page <= 1}
          href={`${base}?search=${encodeURIComponent(search)}&page=${Math.max(1, page - 1)}`}
          className={`rounded-lg border px-3 py-2 text-sm ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
        >
          {zh ? "上一页" : "Previous"}
        </Link>
        <span className="px-3 py-2 text-sm">
          {result.page} / {result.pageCount}
        </span>
        <Link
          aria-disabled={page >= result.pageCount}
          href={`${base}?search=${encodeURIComponent(search)}&page=${Math.min(result.pageCount, page + 1)}`}
          className={`rounded-lg border px-3 py-2 text-sm ${page >= result.pageCount ? "pointer-events-none opacity-40" : ""}`}
        >
          {zh ? "下一页" : "Next"}
        </Link>
      </div>
    </>
  );
}
