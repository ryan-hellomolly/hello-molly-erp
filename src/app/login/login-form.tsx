"use client";
import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
export function LoginForm({ zh }: { zh: boolean }) {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="mt-8 space-y-5">
      <label className="block text-sm font-medium text-slate-700">
        {zh ? "邮箱" : "Email"}
        <input
          name="email"
          type="email"
          value="admin@hellomolly.com.au"
          autoComplete="username"
          required
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        {zh ? "密码" : "Password"}
        <input
          name="password"
          type="password"
          value="LocalAdmin!2026-change-me"
          autoComplete="current-password"
          required
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
        />
      </label>
      {state?.error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <button
        disabled={pending}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {pending ? (zh ? "正在登录…" : "Signing in…") : zh ? "登录" : "Sign in"}
      </button>
    </form>
  );
}
