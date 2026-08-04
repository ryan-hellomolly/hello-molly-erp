import { notFound } from "next/navigation";
import { MeasurementTemplateManager } from "@/components/templates/measurement-template-manager";
import { isLocale } from "@/i18n/config";
import { authService } from "@/server/auth/auth-service";
import { listTemplates } from "@/server/templates/service";

export default async function MeasurementTemplatesPage({
  params,
}: PageProps<"/[locale]/workspace/master-data/templates/measurement">) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    notFound();
  }
  const [rows, user] = await Promise.all([listTemplates("MEASUREMENT"), authService.currentUser()]);
  const zh = raw === "zh-CN";
  return (
    <>
      <nav className="text-sm text-slate-500">
        ERP / {zh ? "基础资料 / 尺寸表模板" : "Master Data / Measurement Chart Templates"}
      </nav>
      <div className="mb-6 mt-3">
        <h1 className="text-3xl font-bold">{zh ? "尺寸表模板" : "Measurement Chart Templates"}</h1>
        <p className="mt-2 text-slate-500">
          {zh
            ? "管理量度点、尺码列、公差及量度说明的版本化模板。"
            : "Manage versioned templates for points of measure, size columns, tolerances and measurement instructions."}
        </p>
      </div>
      <MeasurementTemplateManager
        locale={raw}
        rows={rows}
        canManage={Boolean(user?.roles.includes("SYSTEM_ADMIN"))}
      />
    </>
  );
}
