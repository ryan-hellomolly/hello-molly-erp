import { notFound } from "next/navigation";
import { ProcessTemplateManager } from "@/components/templates/process-template-manager";
import { isLocale } from "@/i18n/config";
import { authService } from "@/server/auth/auth-service";
import { listReferenceValues } from "@/server/reference-data/service";
import { listTemplates } from "@/server/templates/service";

export default async function ProcessTemplatesPage({
  params,
}: PageProps<"/[locale]/workspace/style-design/templates/process">) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    notFound();
  }
  const [rows, processingTypes, user] = await Promise.all([
    listTemplates("PROCESS"),
    listReferenceValues("PROCESSING_TYPE"),
    authService.currentUser(),
  ]);
  const zh = raw === "zh-CN";
  return (
    <>
      <nav className="text-sm text-slate-500">
        ERP / {zh ? "款式设计 / 工序模板" : "Style Design / Process Templates"}
      </nav>
      <div className="mb-6 mt-3">
        <h1 className="text-3xl font-bold">{zh ? "工序模板" : "Process Templates"}</h1>
        <p className="mt-2 text-slate-500">
          {zh
            ? "管理工序步骤、工时、单价与关键工序标记的模板。"
            : "Manage templates of process steps, work time, unit pricing and key-process flags."}
        </p>
      </div>
      <ProcessTemplateManager
        locale={raw}
        rows={rows}
        canManage={Boolean(user?.roles.includes("SYSTEM_ADMIN"))}
        processingTypes={processingTypes
          .filter((row) => row.active)
          .map((row) => ({ id: row.id, nameEn: row.nameEn, nameZh: row.nameZh }))}
      />
    </>
  );
}
