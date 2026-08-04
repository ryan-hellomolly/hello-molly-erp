import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FactoryForm } from "@/components/factories/factory-form";
import { isLocale } from "@/i18n/config";
import { requireSystemAdmin } from "@/server/auth/authorization";
import { getFactory, listFactoryAuditEvents } from "@/server/factories/service";
export default async function FactoryPage({
  params,
}: PageProps<"/[locale]/workspace/master-data/factories/[id]">) {
  const { locale: raw, id } = await params;
  if (!isLocale(raw)) {notFound();}
  if (!(await requireSystemAdmin())) {redirect(`/${raw}/workspace/master-data/factories`);}
  const factory = await getFactory(id);
  if (!factory) {notFound();}
  const audit = await listFactoryAuditEvents(id);
  const zh = raw === "zh-CN";
  return (
    <>
      <Link
        href={`/${raw}/workspace/master-data/factories`}
        className="text-sm text-blue-600 hover:underline"
      >
        ← {zh ? "返回加工厂列表" : "Back to factories"}
      </Link>
      <div className="mb-6 mt-4">
        <h1 className="text-3xl font-bold">
          {factory.code} · {factory.name}
        </h1>
        <p className="mt-2 text-slate-500">
          {zh
            ? "管理联系人、生产能力、状态和审计记录。"
            : "Manage contacts, capabilities, status and audit history."}
        </p>
      </div>
      <FactoryForm locale={raw} factory={factory} />
      <section className="mt-6 rounded-2xl border bg-white">
        <h2 className="border-b p-5 text-lg font-semibold">{zh ? "审计记录" : "Audit history"}</h2>
        {audit.length ? (
          <ul className="divide-y">
            {audit.map((event) => (
              <li key={event.id} className="grid gap-2 p-5 text-sm md:grid-cols-3">
                <time>{event.occurredAt.toLocaleString(raw)}</time>
                <strong>{event.action}</strong>
                <span>
                  {event.actor?.displayName ?? event.actor?.email ?? (zh ? "系统" : "System")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-5 text-sm text-slate-500">
            {zh ? "暂无修改记录" : "No changes recorded"}
          </p>
        )}
      </section>
    </>
  );
}
