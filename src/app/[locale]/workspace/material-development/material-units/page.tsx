import { notFound } from "next/navigation";
import { ReferenceModulePage } from "@/components/reference-data/reference-module-page";
import { isLocale } from "@/i18n/config";
export default async function MaterialUnitsPage({
  params,
}: PageProps<"/[locale]/workspace/material-development/material-units">) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  return (
    <ReferenceModulePage
      locale={locale}
      kind="UNIT"
      titleZh="物料单位"
      titleEn="Material Units"
      fixedCategory="MATERIAL"
    />
  );
}
