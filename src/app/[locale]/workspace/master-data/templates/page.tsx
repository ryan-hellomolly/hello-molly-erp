import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
export default async function TemplatesPage({
  params,
}: PageProps<"/[locale]/workspace/master-data/templates">) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    notFound();
  }
  redirect(`/${raw}/workspace/master-data/templates/construction`);
}
