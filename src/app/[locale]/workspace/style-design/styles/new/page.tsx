import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buildReferenceTree } from "@/components/reference-data/reference-tree";
import { StyleCreateForm } from "@/components/styles/style-create-form";
import { isLocale } from "@/i18n/config";
import { requireSystemAdmin } from "@/server/auth/authorization";
import { listCustomers } from "@/server/customers/service";
import { listReferenceValues } from "@/server/reference-data/service";
import { listTemplates } from "@/server/templates/service";

export default async function NewStylePage({
  params,
}: PageProps<"/[locale]/workspace/style-design/styles/new">) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    notFound();
  }
  if (!(await requireSystemAdmin())) {
    redirect(`/${raw}/workspace/style-design/styles`);
  }
  const [
    customers,
    units,
    constructionTemplates,
    measurementTemplates,
    styleTypes,
    seasons,
    years,
    stages,
  ] = await Promise.all([
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
        <h1 className="text-3xl font-bold">{zh ? "新增款式" : "New style"}</h1>
        <p className="mt-2 text-slate-500">
          {zh
            ? "创建后将跳转至款式详情页。"
            : "You'll be taken to the style's detail page after it's created."}
        </p>
      </div>
      <StyleCreateForm locale={raw} options={options} />
    </>
  );
}
