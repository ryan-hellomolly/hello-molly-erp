import { navigation, labelFor } from "@/config/navigation";
import { isLocale } from "@/i18n/config";
import { notFound } from "next/navigation";
export default async function ModulePage({ params }: PageProps<"/[locale]/workspace/[module]">) {
  const { locale, module } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const item = navigation.find((x) => x.id === module);
  if (!item) {
    notFound();
  }
  return (
    <>
      <nav className="text-sm text-slate-500">ERP / {labelFor(item, locale)}</nav>
      <h1 className="mt-3 text-3xl font-bold">{labelFor(item, locale)}</h1>
      <p className="mt-2 text-slate-500">
        {locale === "zh-CN"
          ? "模块页面框架已建立，业务页面将在后续迭代接入。"
          : "The module shell is ready for business pages in subsequent iterations."}
      </p>
      <div className="mt-8 rounded-2xl border bg-white p-8">
        <h2 className="font-semibold">{locale === "zh-CN" ? "模块概览" : "Module overview"}</h2>
        <p className="mt-3 text-sm text-slate-500">
          {item.children?.length ?? 0}{" "}
          {locale === "zh-CN" ? "个已配置子菜单" : "configured child menus"}
        </p>
      </div>
    </>
  );
}
