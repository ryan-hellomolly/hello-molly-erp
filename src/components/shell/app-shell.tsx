"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { labelFor, type NavigationItem } from "@/config/navigation";
import { changeLocaleAction, logoutAction } from "@/app/actions/auth";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { HelloMollyMark } from "@/components/brand/hello-molly-mark";
export function AppShell({
  locale,
  userName,
  items,
  children,
}: {
  locale: Locale;
  userName: string;
  items: NavigationItem[];
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const zh = locale === "zh-CN";
  const other = zh ? "en-AU" : "zh-CN";
  const pathname = usePathname();
  const switchedPath = pathname.replace(`/${locale}/`, `/${other}/`);
  return (
    <main className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 shadow-sm backdrop-blur md:px-5">
        <div className="flex items-center gap-3">
          <button
            aria-label={zh ? "折叠菜单" : "Toggle navigation"}
            onClick={() => {
              if (window.innerWidth < 768) {
                setMobileOpen((value) => !value);
              } else {
                setCollapsed((value) => !value);
              }
            }}
            className="grid size-10 place-items-center rounded-full border border-slate-200 bg-white text-lg transition hover:border-pink-300 hover:bg-pink-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500"
          >
            <span aria-hidden="true">☰</span>
          </button>
          <HelloMollyMark />
        </div>
        <div className="flex items-center gap-3 text-sm">
          <form action={changeLocaleAction}>
            <input type="hidden" name="locale" value={other} />
            <input type="hidden" name="returnTo" value={switchedPath} />
            <PendingSubmitButton
              idleLabel={zh ? "EN" : "中文"}
              pendingLabel="…"
              className="rounded-full border border-slate-200 px-3 py-2 font-semibold transition hover:border-pink-300 hover:bg-pink-50"
            />
          </form>
          <span className="hidden rounded-full bg-slate-100 px-3 py-2 font-medium sm:inline">
            {userName}
          </span>
          <form action={logoutAction}>
            <PendingSubmitButton
              idleLabel={zh ? "退出" : "Sign out"}
              pendingLabel={zh ? "退出中…" : "Signing out…"}
              className="rounded-full bg-slate-950 px-4 py-2 font-semibold text-white transition hover:bg-pink-600"
            />
          </form>
        </div>
      </header>
      <div
        className={`grid min-h-[calc(100vh-4rem)] ${collapsed ? "md:grid-cols-[72px_1fr]" : "md:grid-cols-[260px_1fr]"}`}
      >
        {mobileOpen && (
          <button
            aria-label={zh ? "关闭菜单" : "Close navigation"}
            className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <aside
          className={`fixed inset-y-16 left-0 z-40 w-[280px] overflow-y-auto border-r border-slate-200 bg-white p-3 shadow-xl transition-transform md:static md:block md:w-auto md:translate-x-0 md:shadow-none ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <nav aria-label={zh ? "ERP 导航" : "ERP navigation"} className="space-y-1">
            {items.map((item) => (
              <div key={item.id}>
                <Link
                  href={`/${locale}/workspace/${item.id}`}
                  title={labelFor(item, locale)}
                  onClick={() => setMobileOpen(false)}
                  data-active={pathname === `/${locale}/workspace/${item.id}`}
                  className="group block rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-pink-50 hover:text-pink-700 data-[active=true]:bg-pink-50 data-[active=true]:text-pink-700"
                >
                  <span className="mr-3 inline-block size-2 rounded-full bg-slate-300 transition group-hover:bg-pink-400 group-data-[active=true]:bg-pink-500" />
                  {!collapsed && labelFor(item, locale)}
                </Link>
                {!collapsed &&
                  item.children?.map((child) => (
                    <Link
                      key={child.id}
                      href={`/${locale}/workspace/${child.path ?? `${item.id}?section=${child.id}`}`}
                      onClick={() => setMobileOpen(false)}
                      data-active={Boolean(child.path && pathname.endsWith(child.path))}
                      className="my-0.5 block truncate rounded-lg py-2 pl-10 pr-2 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-pink-700 data-[active=true]:bg-pink-50 data-[active=true]:text-pink-700"
                    >
                      {labelFor(child, locale)}
                    </Link>
                  ))}
              </div>
            ))}
          </nav>
        </aside>
        <section className="min-w-0 p-4 md:p-6 lg:p-8">{children}</section>
      </div>
    </main>
  );
}
