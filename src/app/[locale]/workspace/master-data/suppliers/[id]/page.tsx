import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SupplierEditor } from "@/components/suppliers/supplier-editor";
import { isLocale } from "@/i18n/config";
import { requireSystemAdmin } from "@/server/auth/authorization";
import {
  certificationStatus,
  getSupplier,
  listSupplierAuditEvents,
} from "@/server/suppliers/service";

export default async function SupplierPage({
  params,
}: PageProps<"/[locale]/workspace/master-data/suppliers/[id]">) {
  const { locale: raw, id } = await params;
  if (!isLocale(raw)) {notFound();}
  if (!(await requireSystemAdmin())) {redirect(`/${raw}/workspace/master-data/suppliers`);}
  const supplier = await getSupplier(id);
  if (!supplier) {notFound();}
  const audit = await listSupplierAuditEvents(id);
  const zh = raw === "zh-CN";
  return (
    <>
      <Link
        href={`/${raw}/workspace/master-data/suppliers`}
        className="text-sm text-blue-600 hover:underline"
      >
        ← {zh ? "返回供应商列表" : "Back to suppliers"}
      </Link>
      <div className="mb-6 mt-4">
        <h1 className="text-3xl font-bold">
          {supplier.code} · {supplier.name}
        </h1>
        <p className="mt-2 text-slate-500">
          {zh
            ? "管理供应商资料、状态、认证和审计记录。"
            : "Manage supplier details, status, certifications and audit history."}
        </p>
      </div>
      <SupplierEditor supplier={supplier} locale={raw} />
      <section className="mt-6 rounded-2xl border bg-white">
        <h2 className="border-b p-5 text-lg font-semibold">{zh ? "认证记录" : "Certifications"}</h2>
        {supplier.certifications.length ? (
          <ul className="divide-y">
            {supplier.certifications.map((item) => (
              <li key={item.id} className="grid gap-2 p-5 text-sm md:grid-cols-4">
                <strong>{item.certificationType}</strong>
                <span>{item.certificateNumber ?? "—"}</span>
                <time>{item.expiresAt.toLocaleDateString(raw)}</time>
                <span>{certificationStatus(item.expiresAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-5 text-sm text-slate-500">{zh ? "暂无认证" : "No certifications"}</p>
        )}
      </section>
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
