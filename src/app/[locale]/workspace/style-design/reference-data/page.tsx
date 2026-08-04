import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
export default async function StyleDesignReferenceDataPage({
  params,
}: PageProps<"/[locale]/workspace/style-design/reference-data">) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    notFound();
  }
  redirect(`/${raw}/workspace/style-design/reference-data/style-types`);
}
