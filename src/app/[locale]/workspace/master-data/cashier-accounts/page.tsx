import { notFound } from "next/navigation";
import { CashierAccountManager } from "@/components/foundation-records/foundation-managers";
import { isLocale } from "@/i18n/config";
import { authService } from "@/server/auth/auth-service";
import { listCashierAccounts } from "@/server/foundation-records/service";
export default async function CashierAccountsPage({
  params,
}: PageProps<"/[locale]/workspace/master-data/cashier-accounts">) {
  const { locale } = await params;
  if (!isLocale(locale)) {notFound();}
  const [rows, user] = await Promise.all([listCashierAccounts(), authService.currentUser()]);
  const zh = locale === "zh-CN";
  return (
    <>
      <nav className="text-sm text-slate-500">
        ERP / {zh ? "基础资料 / 出纳账户" : "Master Data / Cashier Accounts"}
      </nav>
      <h1 className="mb-6 mt-3 text-3xl font-bold">{zh ? "出纳账户" : "Cashier Accounts"}</h1>
      <CashierAccountManager
        locale={locale}
        rows={rows}
        canManage={Boolean(user?.roles.includes("SYSTEM_ADMIN"))}
      />
    </>
  );
}
