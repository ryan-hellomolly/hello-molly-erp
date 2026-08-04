import { notFound } from "next/navigation";
import { ReferenceModulePage } from "@/components/reference-data/reference-module-page";
import { isLocale } from "@/i18n/config";
export default async function FinishedGoodsUnitsPage({
  params,
}: PageProps<"/[locale]/workspace/style-design/finished-goods-units">) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  return (
    <ReferenceModulePage
      locale={locale}
      kind="UNIT"
      titleZh="成品单位"
      titleEn="Finished Goods Units"
      fixedCategory="FINISHED_GOODS"
    />
  );
}
