"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authService } from "@/server/auth/auth-service";
import { assertTrustedOrigin, consumeRateLimit, requestIdentity } from "@/server/auth/security";
import { cookies } from "next/headers";
import { db } from "@/server/db";
import { isLocale } from "@/i18n/config";
export type LoginState = { error?: string } | undefined;
const schema = z.object({ email: z.email(), password: z.string().min(8) });
export async function loginAction(_: LoginState, data: FormData): Promise<LoginState> {
  await assertTrustedOrigin();
  const identity = await requestIdentity();
  const rate = await consumeRateLimit("login", identity, 10, 900);
  if (!rate.allowed) {
    return { error: "Too many attempts. Try later / 尝试次数过多，请稍后再试" };
  }
  const parsed = schema.safeParse({ email: data.get("email"), password: data.get("password") });
  if (!parsed.success) {
    return { error: "Please enter valid credentials / 请输入有效账号密码" };
  }
  const user = await authService.authenticateWithPassword(parsed.data.email, parsed.data.password);
  if (!user) {
    return { error: "Invalid credentials or disabled account / 账号密码错误或账号已禁用" };
  }
  await authService.createSession(user);
  redirect("/workspace");
}
export async function logoutAction() {
  await assertTrustedOrigin();
  await authService.logout();
  redirect("/login");
}
export async function changeLocaleAction(data: FormData) {
  await assertTrustedOrigin();
  const locale = String(data.get("locale"));
  const returnTo = String(data.get("returnTo") || `/${locale}/workspace`);
  if (!isLocale(locale)) {
    throw new Error("Unsupported locale");
  }
  const user = await authService.currentUser();
  if (!user) {
    redirect("/login");
  }
  await db.user.update({ where: { id: user.id }, data: { locale } });
  (await cookies()).set("hm_erp_locale", locale, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 31_536_000,
  });
  redirect(returnTo.startsWith(`/${locale}/`) ? returnTo : `/${locale}/workspace`);
}
