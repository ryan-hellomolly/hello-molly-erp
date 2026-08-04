"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { labelFor, type NavigationItem } from "@/config/navigation";
import { changeLocaleAction, logoutAction } from "@/app/actions/auth";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
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
  const zh = locale === "zh-CN";
  const other = zh ? "en-AU" : "zh-CN";
  const pathname = usePathname();
  const switchedPath = pathname.replace(`/${locale}/`, `/${other}/`);
  return (
    <main className="min-h-screen bg-slate-100">
      <header className="flex h-16 items-center justify-between border-b bg-white px-5">
        <div className="flex items-center gap-3">
          <button
            aria-label={zh ? "折叠菜单" : "Toggle navigation"}
            onClick={() => setCollapsed((x) => !x)}
            className="rounded-lg border px-3 py-2"
          >
            ☰
          </button>
          <strong className="tracking-wider text-blue-600">
            HELLO MOLLY <span className="text-slate-400">ERP</span>
          </strong>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <form action={changeLocaleAction}>
            <input type="hidden" name="locale" value={other} />
            <input type="hidden" name="returnTo" value={switchedPath} />
            <PendingSubmitButton
              idleLabel={zh ? "EN" : "中文"}
              pendingLabel="…"
              className="rounded-lg border px-3 py-2"
            />
          </form>
          <span className="hidden sm:inline">{userName}</span>
          <form action={logoutAction}>
            <PendingSubmitButton
              idleLabel={zh ? "退出" : "Sign out"}
              pendingLabel={zh ? "退出中…" : "Signing out…"}
              className="rounded-lg bg-slate-900 px-3 py-2 text-white"
            />
          </form>
        </div>
      </header>
      <div
        className={`grid min-h-[calc(100vh-4rem)] ${collapsed ? "md:grid-cols-[72px_1fr]" : "md:grid-cols-[260px_1fr]"}`}
      >
        <aside className="hidden overflow-y-auto bg-slate-950 p-3 text-slate-300 md:block">
          <nav aria-label={zh ? "ERP 导航" : "ERP navigation"} className="space-y-1">
            {items.map((item) => (
              <div key={item.id}>
                <Link
                  href={`/${locale}/workspace/${item.id}`}
                  title={labelFor(item, locale)}
                  className="block rounded-lg px-3 py-2.5 text-sm hover:bg-slate-900"
                >
                  <span className="mr-3 text-slate-500">◆</span>
                  {!collapsed && labelFor(item, locale)}
                </Link>
                {!collapsed &&
                  item.children?.map((child) => (
                    <Link
                      key={child.id}
                      href={`/${locale}/workspace/${child.path ?? `${item.id}?section=${child.id}`}`}
                      className="block truncate py-1.5 pl-10 pr-2 text-xs text-slate-500 hover:text-white"
                    >
                      {labelFor(child, locale)}
                    </Link>
                  ))}
              </div>
            ))}
          </nav>
        </aside>
        <section className="min-w-0 p-5 lg:p-8">{children}</section>
      </div>
    </main>
  );
}
