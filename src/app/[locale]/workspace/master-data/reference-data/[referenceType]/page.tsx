import { notFound } from "next/navigation";
import { ReferenceModulePage } from "@/components/reference-data/reference-module-page";
import { isLocale } from "@/i18n/config";
const modules = {
  "settlement-methods": ["SETTLEMENT_METHOD", "结算方式", "Settlement Methods"],
  "invoice-types": ["INVOICE_TYPE", "发票类型", "Invoice Types"],
  "sample-types": ["SAMPLE_TYPE", "样板类型", "Sample Types"],
  "expense-types": ["EXPENSE_TYPE", "费用类型", "Expense Types"],
  "size-sort": ["SIZE", "尺码排序", "Size Sorting"],
  "sales-channels": ["SALES_CHANNEL", "销售渠道", "Sales Channels"],
} as const;
export default async function ReferenceTypePage({
  params,
}: PageProps<"/[locale]/workspace/master-data/reference-data/[referenceType]">) {
  const { locale, referenceType } = await params;
  if (!isLocale(locale) || !(referenceType in modules)) {
    notFound();
  }
  const [kind, titleZh, titleEn] = modules[referenceType as keyof typeof modules];
  return <ReferenceModulePage locale={locale} kind={kind} titleZh={titleZh} titleEn={titleEn} />;
}
