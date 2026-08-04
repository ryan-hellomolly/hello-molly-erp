import { notFound } from "next/navigation";
import { ConstructionTemplateManager } from "@/components/templates/construction-template-manager";
import { isLocale } from "@/i18n/config";
import { authService } from "@/server/auth/auth-service";
import { listTemplates } from "@/server/templates/service";

export default async function ConstructionTemplatesPage({
  params,
}: PageProps<"/[locale]/workspace/master-data/templates/construction">) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    notFound();
  }
  const [rows, user] = await Promise.all([
    listTemplates("CONSTRUCTION"),
    authService.currentUser(),
  ]);
  const zh = raw === "zh-CN";
  return (
    <>
      <nav className="text-sm text-slate-500">
        ERP / {zh ? "基础资料 / 工艺要求模板" : "Master Data / Construction Requirement Templates"}
      </nav>
      <div className="mb-6 mt-3">
        <h1 className="text-3xl font-bold">
          {zh ? "工艺要求模板" : "Construction Requirement Templates"}
        </h1>
        <p className="mt-2 text-slate-500">
          {zh
            ? "管理车缝、整烫、包装及其他生产工艺要求的版本化模板。"
            : "Manage versioned templates for sewing, pressing, packing and other construction requirements."}
        </p>
      </div>
      <ConstructionTemplateManager
        locale={raw}
        rows={rows}
        canManage={Boolean(user?.roles.includes("SYSTEM_ADMIN"))}
      />
    </>
  );
}
