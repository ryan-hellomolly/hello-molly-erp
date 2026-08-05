import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buildReferenceTree } from "@/components/reference-data/reference-tree";
import { ColorwayManager } from "@/components/styles/colorway-manager";
import { StyleEditor } from "@/components/styles/style-editor";
import { isLocale } from "@/i18n/config";
import { requireSystemAdmin } from "@/server/auth/authorization";
import { listCustomers } from "@/server/customers/service";
import { listReferenceValues } from "@/server/reference-data/service";
import { listTemplates } from "@/server/templates/service";
import { getStyle, listStyleAuditEvents } from "@/server/styles/service";

export default async function StyleDetailPage({
  params,
}: PageProps<"/[locale]/workspace/style-design/styles/[id]">) {
  const { locale: raw, id } = await params;
  if (!isLocale(raw)) {
    notFound();
  }
  if (!(await requireSystemAdmin())) {
    redirect(`/${raw}/workspace/style-design/styles`);
  }
  const style = await getStyle(id);
  if (!style) {
    notFound();
  }
  const [
    audit,
    customers,
    units,
    constructionTemplates,
    measurementTemplates,
    styleTypes,
    seasons,
    years,
    stages,
  ] = await Promise.all([
    listStyleAuditEvents(id),
    listCustomers({ pageSize: 100, sort: "name" }),
    listReferenceValues("UNIT"),
    listTemplates("CONSTRUCTION"),
    listTemplates("MEASUREMENT"),
    listReferenceValues("STYLE_TYPE"),
    listReferenceValues("SEASON"),
    listReferenceValues("YEAR"),
    listReferenceValues("STAGE"),
  ]);
  const zh = raw === "zh-CN";
  const byNameId = (rows: { id: string; nameEn: string; nameZh: string; active: boolean }[]) =>
    rows
      .filter((row) => row.active)
      .map((row) => ({ id: row.id, nameEn: row.nameEn, nameZh: row.nameZh }));
  const options = {
    customers: customers.data.map((c) => ({ id: c.id, code: c.code, name: c.name })),
    units: units
      .filter((unit) => unit.category === "FINISHED_GOODS" && unit.active)
      .map((unit) => ({
        id: unit.id,
        nameEn: unit.nameEn,
        nameZh: unit.nameZh,
        symbol: unit.symbol,
      })),
    constructionTemplates: constructionTemplates.map((t) => ({
      id: t.id,
      code: t.code,
      nameEn: t.nameEn,
      nameZh: t.nameZh,
    })),
    measurementTemplates: measurementTemplates.map((t) => ({
      id: t.id,
      code: t.code,
      nameEn: t.nameEn,
      nameZh: t.nameZh,
    })),
    styleTypes: buildReferenceTree(styleTypes.filter((row) => row.active)).map((row) => ({
      id: row.id,
      nameEn: row.nameEn,
      nameZh: row.nameZh,
      depth: row.depth,
    })),
    seasons: byNameId(seasons),
    years: byNameId(years),
    stages: byNameId(stages),
  };
  return (
    <>
      <Link
        href={`/${raw}/workspace/style-design/styles`}
        className="text-sm text-blue-600 hover:underline"
      >
        ← {zh ? "返回款式列表" : "Back to styles"}
      </Link>
      <div className="mb-6 mt-4">
        <h1 className="text-3xl font-bold">
          {style.code} · {zh ? style.nameZh : style.nameEn}
        </h1>
        <p className="mt-2 text-slate-500">
          {zh
            ? "编辑款式资料、状态并查看不可变更的审计记录。"
            : "Edit style details and status, and review immutable audit history."}
        </p>
      </div>
      <StyleEditor style={style} locale={raw} options={options} />
      <ColorwayManager locale={raw} styleId={id} colorways={style.colorways} />
      <section className="mt-6 rounded-2xl border bg-white">
        <h2 className="border-b p-5 text-lg font-semibold">{zh ? "审计记录" : "Audit history"}</h2>
        {audit.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            {zh ? "暂无修改记录。" : "No changes recorded yet."}
          </p>
        ) : (
          <ul className="divide-y">
            {audit.map((event) => (
              <li key={event.id} className="grid gap-1 p-5 text-sm md:grid-cols-[12rem_1fr_16rem]">
                <time>
                  {new Intl.DateTimeFormat(raw, { dateStyle: "medium", timeStyle: "short" }).format(
                    event.occurredAt,
                  )}
                </time>
                <strong>{event.action}</strong>
                <span className="text-slate-500">
                  {event.actor?.displayName ?? event.actor?.email ?? (zh ? "系统" : "System")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
