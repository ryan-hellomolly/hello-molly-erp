import { notFound } from "next/navigation";
import { ReferenceModulePage } from "@/components/reference-data/reference-module-page";
import { isLocale } from "@/i18n/config";
const modules = {
  "style-types": ["STYLE_TYPE", "款式类型", "Style Type"],
  seasons: ["SEASON", "季节", "Season"],
  years: ["YEAR", "年份", "Year"],
  stages: ["STAGE", "波段", "Stage"],
  "processing-types": ["PROCESSING_TYPE", "加工类型", "Processing Type"],
  "wash-types": ["WASH_TYPE", "洗水类型", "Wash Type"],
  "fabric-trim-types": ["FABRIC_TRIM_TYPE", "面辅类型", "Fabric/Trim Type"],
  "execution-standards": ["EXECUTION_STANDARD", "执行标准", "Execution Standard"],
} as const;
export default async function StyleDesignReferenceTypePage({
  params,
}: PageProps<"/[locale]/workspace/style-design/reference-data/[referenceType]">) {
  const { locale, referenceType } = await params;
  if (!isLocale(locale) || !(referenceType in modules)) {
    notFound();
  }
  const [kind, titleZh, titleEn] = modules[referenceType as keyof typeof modules];
  return <ReferenceModulePage locale={locale} kind={kind} titleZh={titleZh} titleEn={titleEn} />;
}
