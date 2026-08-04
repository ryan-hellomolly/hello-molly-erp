import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
export default async function ReferenceDataPage({
  params,
}: PageProps<"/[locale]/workspace/master-data/reference-data">) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    notFound();
  }
  redirect(`/${raw}/workspace/master-data/reference-data/size-sort`);
}
