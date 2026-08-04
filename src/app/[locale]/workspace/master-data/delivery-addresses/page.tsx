import { notFound } from "next/navigation";
import { DeliveryAddressManager } from "@/components/foundation-records/foundation-managers";
import { isLocale } from "@/i18n/config";
import { authService } from "@/server/auth/auth-service";
import { listDeliveryAddresses } from "@/server/foundation-records/service";
export default async function DeliveryAddressesPage({
  params,
}: PageProps<"/[locale]/workspace/master-data/delivery-addresses">) {
  const { locale } = await params;
  if (!isLocale(locale)) {notFound();}
  const [rows, user] = await Promise.all([listDeliveryAddresses(), authService.currentUser()]);
  const zh = locale === "zh-CN";
  return (
    <>
      <nav className="text-sm text-slate-500">
        ERP / {zh ? "基础资料 / 送货地址" : "Master Data / Delivery Addresses"}
      </nav>
      <h1 className="mb-6 mt-3 text-3xl font-bold">{zh ? "送货地址" : "Delivery Addresses"}</h1>
      <DeliveryAddressManager
        locale={locale}
        rows={rows}
        canManage={Boolean(user?.roles.includes("SYSTEM_ADMIN"))}
      />
    </>
  );
}
