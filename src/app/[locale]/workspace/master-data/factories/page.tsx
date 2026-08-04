import Link from "next/link";
import { notFound } from "next/navigation";
import { FactoryForm } from "@/components/factories/factory-form";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { isLocale } from "@/i18n/config";
import { authService } from "@/server/auth/auth-service";
import { listFactories } from "@/server/factories/service";
export default async function FactoriesPage({
  params,
  searchParams,
}: PageProps<"/[locale]/workspace/master-data/factories">) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {notFound();}
  const query = await searchParams;
  const search = typeof query.search === "string" ? query.search : "";
  const [factories, user] = await Promise.all([listFactories(search), authService.currentUser()]);
  const zh = raw === "zh-CN";
  return (
    <>
      <nav className="text-sm text-slate-500">
        ERP / {zh ? "基础资料 / 加工厂" : "Master Data / Factories"}
      </nav>
      <div className="mb-6 mt-3 flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{zh ? "加工厂" : "Factories"}</h1>
          <p className="mt-2 text-slate-500">
            {zh ? `共 ${factories.length} 个加工厂` : `${factories.length} factories`}
          </p>
        </div>
        <form className="flex h-fit gap-2">
          <input
            name="search"
            defaultValue={search}
            placeholder={zh ? "编码、名称、城市或能力" : "Code, name, city or capability"}
            className="rounded-lg border px-3 py-2"
          />
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
            ＋ {zh ? "新增加工厂" : "New factory"}
          </summary>
          <FactoryForm locale={raw} />
        </details>
      )}
      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {[
                zh ? "编码" : "Code",
                zh ? "名称" : "Name",
                zh ? "地点" : "Location",
                zh ? "生产能力" : "Capabilities",
                zh ? "联系人" : "Contact",
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
            {factories.map((factory) => (
              <tr key={factory.id} className="border-t">
                <td className="px-4 py-3 font-medium">{factory.code}</td>
                <td className="px-4 py-3">{factory.name}</td>
                <td className="px-4 py-3">
                  {[factory.city, factory.countryCode].filter(Boolean).join(", ")}
                </td>
                <td className="px-4 py-3">{factory.capabilities.join(" / ") || "—"}</td>
                <td className="px-4 py-3">{factory.contactName ?? "—"}</td>
                <td className="px-4 py-3">{factory.status}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/${raw}/workspace/master-data/factories/${factory.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {zh ? "管理" : "Manage"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!factories.length && (
          <p className="p-10 text-center text-sm text-slate-500">
            {zh ? "暂无加工厂" : "No factories"}
          </p>
        )}
      </div>
    </>
  );
}
