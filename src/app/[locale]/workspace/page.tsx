import { isLocale } from "@/i18n/config";
import { notFound } from "next/navigation";
export default async function Dashboard({ params }: PageProps<"/[locale]/workspace">) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const zh = locale === "zh-CN";
  return (
    <>
      <p className="text-sm font-semibold text-blue-600">
        {zh ? "运营控制塔" : "Operations control tower"}
      </p>
      <h1 className="mt-2 text-3xl font-bold">{zh ? "今日工作台" : "Today’s workspace"}</h1>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [zh ? "开发中款式" : "Active styles", "1,284"],
          [zh ? "进行中样板" : "Samples in progress", "46"],
          [zh ? "采购订单" : "Purchase orders", "128"],
          [zh ? "QC 风险" : "QC attention", "7"],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border bg-white p-6">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-bold">{value}</p>
          </article>
        ))}
      </div>
    </>
  );
}
