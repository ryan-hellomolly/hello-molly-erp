import { ReferenceManager, type Kind } from "@/components/reference-data/reference-manager";
import type { Locale } from "@/i18n/config";
import { authService } from "@/server/auth/auth-service";
import { listReferenceValues } from "@/server/reference-data/service";
export async function ReferenceModulePage({
  locale,
  kind,
  titleZh,
  titleEn,
  fixedCategory,
}: {
  locale: Locale;
  kind: Kind;
  titleZh: string;
  titleEn: string;
  fixedCategory?: string;
}) {
  const [allRows, user] = await Promise.all([listReferenceValues(kind), authService.currentUser()]);
  const rows = fixedCategory
    ? allRows.filter(({ category }) => category === fixedCategory)
    : allRows;
  const zh = locale === "zh-CN";
  return (
    <>
      <nav className="text-sm text-slate-500">ERP / {zh ? titleZh : titleEn}</nav>
      <div className="mb-6 mt-3">
        <h1 className="text-3xl font-bold">{zh ? titleZh : titleEn}</h1>
        <p className="mt-2 text-slate-500">
          {zh
            ? "独立维护编码、双语名称、排序与启用状态。"
            : "Manage codes, bilingual names, ordering and availability independently."}
        </p>
      </div>
      <ReferenceManager
        locale={locale}
        rows={rows}
        canManage={Boolean(user?.roles.includes("SYSTEM_ADMIN"))}
        kinds={[kind]}
        fixedCategory={fixedCategory}
      />
    </>
  );
}
