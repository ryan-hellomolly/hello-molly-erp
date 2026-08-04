import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/server/auth/session";
const modules = [
  "Dashboard",
  "Product Planning",
  "Style Design",
  "Material Development",
  "Sampling",
  "Bulk Production",
  "Purchasing",
  "Inventory",
  "Finance",
  "Reports",
  "System",
];
export default async function WorkspacePage({ searchParams }: PageProps<"/workspace">) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const zh = (await searchParams).lang === "zh";
  return (
    <main className="min-h-screen bg-slate-100">
      <header className="flex h-16 items-center justify-between border-b bg-white px-6">
        <div className="font-black tracking-wider text-blue-600">
          HELLO MOLLY <span className="text-sm text-slate-400">ERP</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link
            href={zh ? "/workspace?lang=en" : "/workspace?lang=zh"}
            className="rounded-lg border px-3 py-2"
          >
            {zh ? "EN" : "中文"}
          </Link>
          <span className="hidden sm:inline">{user.displayName}</span>
          <form action={logoutAction}>
            <button className="rounded-lg bg-slate-900 px-3 py-2 text-white">
              {zh ? "退出" : "Sign out"}
            </button>
          </form>
        </div>
      </header>
      <div className="grid min-h-[calc(100vh-4rem)] md:grid-cols-[240px_1fr]">
        <aside className="hidden bg-slate-950 p-4 text-slate-300 md:block">
          <p className="px-3 py-2 text-xs uppercase tracking-widest text-slate-500">
            {zh ? "业务模块" : "Business modules"}
          </p>
          {modules.map((m, i) => (
            <div
              key={m}
              className={`mt-1 rounded-lg px-3 py-2.5 text-sm ${i === 0 ? "bg-blue-600 text-white" : ""}`}
            >
              {m}
            </div>
          ))}
        </aside>
        <section className="p-8">
          <p className="font-medium text-blue-600">{zh ? "工作台" : "Workspace"}</p>
          <h1 className="mt-2 text-3xl font-bold">
            {zh ? `你好，${user.displayName}` : `Hello, ${user.displayName}`}
          </h1>
          <p className="mt-2 text-slate-500">
            {zh
              ? "数据库会话和角色权限验证成功。"
              : "Database session and role verification succeeded."}
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Active styles", "1,284"],
              ["Samples", "46"],
              ["Purchase orders", "128"],
              ["QC attention", "7"],
            ].map(([l, v]) => (
              <article key={l} className="rounded-2xl border bg-white p-6">
                <p className="text-sm text-slate-500">{l}</p>
                <p className="mt-3 text-3xl font-bold">{v}</p>
              </article>
            ))}
          </div>
          <article className="mt-6 rounded-2xl border bg-white p-6">
            <p>{user.email}</p>
            <p className="mt-2 text-sm text-emerald-600">
              {user.roles.join(", ")} · {zh ? "会话已验证" : "Session verified"}
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
