import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";
import { getCurrentUser } from "@/server/auth/session";
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getCurrentUser()) {
    redirect("/workspace");
  }
  const zh = (await searchParams).lang === "zh";
  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-2">
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-xl">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-bold tracking-[.2em] text-blue-600">HELLO MOLLY</p>
              <h1 className="mt-3 text-3xl font-bold">{zh ? "欢迎使用 ERP" : "Welcome to ERP"}</h1>
            </div>
            <Link
              href={zh ? "/login?lang=en" : "/login?lang=zh"}
              className="h-fit rounded-lg border px-3 py-2 text-sm"
            >
              {zh ? "EN" : "中文"}
            </Link>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            {zh
              ? "商品开发、采购、库存及财务协同平台"
              : "Product development, purchasing, inventory and finance operations"}
          </p>
          <LoginForm zh={zh} />
        </div>
      </section>
      <section className="hidden items-center bg-gradient-to-br from-blue-700 to-indigo-950 p-16 text-white lg:flex">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.3em] text-blue-200">
            One operational backbone
          </p>
          <h2 className="mt-6 text-5xl font-bold leading-tight">
            From product idea to customer delivery.
          </h2>
          <p className="mt-6 text-lg text-blue-100">
            A bilingual workspace connecting Australia and China teams.
          </p>
        </div>
      </section>
    </main>
  );
}
