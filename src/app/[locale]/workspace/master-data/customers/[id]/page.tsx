import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CustomerEditor } from "@/components/customers/customer-editor";
import { isLocale } from "@/i18n/config";
import { requireSystemAdmin } from "@/server/auth/authorization";
import { getCustomer, listCustomerAuditEvents } from "@/server/customers/service";

export default async function CustomerDetailPage({
  params,
}: PageProps<"/[locale]/workspace/master-data/customers/[id]">) {
  const { locale: raw, id } = await params;
  if (!isLocale(raw)) {notFound();}
  if (!(await requireSystemAdmin())) {redirect(`/${raw}/workspace/master-data/customers`);}
  const customer = await getCustomer(id);
  if (!customer) {notFound();}
  const audit = await listCustomerAuditEvents(id);
  const zh = raw === "zh-CN";
  return (
    <>
      <Link href={`/${raw}/workspace/master-data/customers`} className="text-sm text-blue-600 hover:underline">
        ← {zh ? "返回客户列表" : "Back to customers"}
      </Link>
      <div className="mb-6 mt-4">
        <h1 className="text-3xl font-bold">{customer.code} · {customer.name}</h1>
        <p className="mt-2 text-slate-500">{zh ? "编辑客户资料、状态并查看不可变更的审计记录。" : "Edit customer details and status, and review immutable audit history."}</p>
      </div>
      <CustomerEditor customer={customer} locale={raw} />
      <section className="mt-6 rounded-2xl border bg-white">
        <h2 className="border-b p-5 text-lg font-semibold">{zh ? "审计记录" : "Audit history"}</h2>
        {audit.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">{zh ? "暂无修改记录。" : "No changes recorded yet."}</p>
        ) : (
          <ul className="divide-y">
            {audit.map((event) => (
              <li key={event.id} className="grid gap-1 p-5 text-sm md:grid-cols-[12rem_1fr_16rem]">
                <time>{new Intl.DateTimeFormat(raw, { dateStyle: "medium", timeStyle: "short" }).format(event.occurredAt)}</time>
                <strong>{event.action}</strong>
                <span className="text-slate-500">{event.actor?.displayName ?? event.actor?.email ?? (zh ? "系统" : "System")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
