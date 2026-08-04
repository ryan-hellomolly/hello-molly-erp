import { redirect } from "next/navigation";
import { authService } from "@/server/auth/auth-service";
import { isLocale } from "@/i18n/config";
export default async function LegacyWorkspace() {
  const user = await authService.currentUser();
  redirect(`/${user && isLocale(user.locale) ? user.locale : "en-AU"}/workspace`);
}
