import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";
import { getCurrentUser } from "@/server/auth/session";
import { HelloMollyMark } from "@/components/brand/hello-molly-mark";
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getCurrentUser()) {
    redirect("/workspace");
  }
  const zh = (await searchParams).lang === "zh";
  return (
    <main className="grid min-h-screen bg-[#f8f7f8] lg:grid-cols-[minmax(460px,0.85fr)_1.15fr]">
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-[2rem] border border-white bg-white p-8 shadow-[0_24px_70px_rgba(54,18,36,0.10)] sm:p-10">
          <div className="flex justify-between">
            <div>
              <HelloMollyMark />
              <h1 className="mt-3 text-3xl font-bold">{zh ? "欢迎使用 ERP" : "Welcome to ERP"}</h1>
            </div>
            <Link
              href={zh ? "/login?lang=en" : "/login?lang=zh"}
              className="h-fit rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold transition hover:border-pink-300 hover:bg-pink-50"
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
      <section className="relative hidden items-center overflow-hidden bg-slate-950 p-16 text-white lg:flex">
        <div className="absolute -right-28 -top-28 size-[32rem] rounded-full bg-pink-500/25 blur-3xl" />
        <div className="absolute -bottom-40 left-16 size-[28rem] rounded-full bg-fuchsia-300/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[.3em] text-pink-300">
            One operational backbone
          </p>
          <h2 className="mt-6 text-5xl font-black leading-[1.08] tracking-tight xl:text-6xl">
            From product idea to customer delivery.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
            A bilingual workspace connecting Australia and China teams.
          </p>
        </div>
      </section>
    </main>
  );
}
