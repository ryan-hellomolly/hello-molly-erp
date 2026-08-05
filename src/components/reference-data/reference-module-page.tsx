import { ReferenceManager, type Kind } from "@/components/reference-data/reference-manager";
import { SimpleReferenceManager } from "@/components/reference-data/simple-reference-manager";
import { StyleTypeManager } from "@/components/reference-data/style-type-manager";
import type { Locale } from "@/i18n/config";
import { authService } from "@/server/auth/auth-service";
import { listReferenceValues } from "@/server/reference-data/service";
export async function ReferenceModulePage({
  locale,
  kind,
  titleZh,
  titleEn,
  fixedCategory,
  forceSimple,
}: {
  locale: Locale;
  kind: Kind;
  titleZh: string;
  titleEn: string;
  fixedCategory?: string;
  forceSimple?: boolean;
}) {
  const [allRows, user] = await Promise.all([listReferenceValues(kind), authService.currentUser()]);
  const rows = fixedCategory
    ? allRows.filter(({ category }) => category === fixedCategory)
    : allRows;
  const zh = locale === "zh-CN";
  const hierarchical = kind === "STYLE_TYPE";
  const simple =
    !hierarchical &&
    (forceSimple ||
      new Set<Kind>([
        "SETTLEMENT_METHOD",
        "INVOICE_TYPE",
        "SAMPLE_TYPE",
        "EXPENSE_TYPE",
        "SIZE",
        "SALES_CHANNEL",
        "SEASON",
        "YEAR",
        "STAGE",
        "PROCESSING_TYPE",
        "WASH_TYPE",
        "FABRIC_TRIM_TYPE",
        "EXECUTION_STANDARD",
      ]).has(kind));
  return (
    <>
      <nav className="text-sm text-slate-500">ERP / {zh ? titleZh : titleEn}</nav>
      <div className="mb-6 mt-3">
        <h1 className="text-3xl font-bold">{zh ? titleZh : titleEn}</h1>
        <p className="mt-2 text-slate-500">
          {hierarchical
            ? zh
              ? "维护带层级结构的款式类型，可逐级添加子级。"
              : "Maintain a hierarchical style type tree, with children nested under each level."
            : simple
              ? zh
                ? "维护可供业务选择的名称清单。"
                : "Maintain the list of names available to business workflows."
              : zh
                ? "独立维护编码、双语名称、排序与启用状态。"
                : "Manage codes, bilingual names, ordering and availability independently."}
        </p>
      </div>
      {hierarchical ? (
        <StyleTypeManager
          locale={locale}
          rows={rows}
          canManage={Boolean(user?.roles.includes("SYSTEM_ADMIN"))}
        />
      ) : simple ? (
        <SimpleReferenceManager
          locale={locale}
          kind={kind}
          rows={rows}
          canManage={Boolean(user?.roles.includes("SYSTEM_ADMIN"))}
          fixedCategory={fixedCategory}
        />
      ) : (
        <ReferenceManager
          locale={locale}
          rows={rows}
          canManage={Boolean(user?.roles.includes("SYSTEM_ADMIN"))}
          kinds={[kind]}
          fixedCategory={fixedCategory}
        />
      )}
    </>
  );
}
