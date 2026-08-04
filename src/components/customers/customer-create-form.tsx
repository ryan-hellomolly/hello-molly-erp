"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";

export function CustomerCreateForm({ locale }: { locale: Locale }) {
  const zh = locale === "zh-CN";
  const router = useRouter();
  const requestLock = useRef(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requestLock.current) {
      return;
    }
    requestLock.current = true;
    setPending(true);
    setMessage("");
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(
          result.error === "DUPLICATE_CUSTOMER"
            ? zh
              ? "客户编码重复，或同一国家/地区已存在同名客户。"
              : "The customer code or name and country combination already exists."
            : zh
              ? "创建失败，请检查输入。"
              : "Unable to create the customer. Check the input.",
        );
        return;
      }
      form.reset();
      setMessage(zh ? "客户已创建。" : "Customer created.");
      router.refresh();
    } catch {
      setMessage(zh ? "网络错误，请重试。" : "Network error. Please try again.");
    } finally {
      requestLock.current = false;
      setPending(false);
    }
  }

  const inputClass = "rounded-lg border px-3 py-2";
  return (
    <details className="mb-5 rounded-2xl border bg-white p-5">
      <summary className="cursor-pointer font-semibold">
        ＋ {zh ? "新增客户" : "New customer"}
      </summary>
      <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="grid gap-1 text-sm">
          {zh ? "客户编码" : "Customer code"}
          <input name="code" required minLength={2} maxLength={30} className={inputClass} />
        </label>
        <label className="grid gap-1 text-sm">
          {zh ? "客户名称" : "Customer name"}
          <input name="name" required minLength={2} maxLength={160} className={inputClass} />
        </label>
        <label className="grid gap-1 text-sm">
          {zh ? "国家/地区代码" : "Country code"}
          <input
            name="countryCode"
            required
            minLength={2}
            maxLength={2}
            placeholder="AU"
            className={`${inputClass} uppercase`}
          />
        </label>
        <label className="grid gap-1 text-sm">
          {zh ? "销售渠道" : "Sales channel"}
          <input name="salesChannel" maxLength={80} className={inputClass} />
        </label>
        <label className="grid gap-1 text-sm">
          {zh ? "负责人" : "Owner"}
          <input name="ownerName" maxLength={120} className={inputClass} />
        </label>
        <button
          disabled={pending}
          aria-busy={pending}
          className="self-end rounded-lg bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (zh ? "创建中…" : "Creating…") : zh ? "创建客户" : "Create customer"}
        </button>
        {message && (
          <p role="status" className="text-sm text-slate-600 md:col-span-3">
            {message}
          </p>
        )}
      </form>
    </details>
  );
}
