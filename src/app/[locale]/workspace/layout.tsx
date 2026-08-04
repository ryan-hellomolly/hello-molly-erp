import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { filterNavigation, navigation } from "@/config/navigation";
import { isLocale } from "@/i18n/config";
import { authService } from "@/server/auth/auth-service";
export default async function WorkspaceLayout({
  children,
  params,
}: LayoutProps<"/[locale]/workspace">) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const user = await authService.currentUser();
  if (!user) {
    redirect("/login");
  }
  return (
    <AppShell
      locale={locale}
      userName={user.displayName}
      items={filterNavigation(navigation, user.roles)}
    >
      {children}
    </AppShell>
  );
}
