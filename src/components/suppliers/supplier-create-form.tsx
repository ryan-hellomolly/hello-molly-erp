"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";

export function SupplierCreateForm({ locale }: { locale: Locale }) {
  const zh = locale === "zh-CN";
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const requestLock = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requestLock.current) {
      return;
    }
    requestLock.current = true;
    setPending(true);
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    try {
      const response = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(
          result.error === "DUPLICATE_SUPPLIER"
            ? zh
              ? "供应商编码或名称重复。"
              : "Supplier code or name already exists."
            : zh
              ? "创建失败。"
              : "Unable to create supplier.",
        );
        return;
      }
      form.reset();
      setMessage(zh ? "供应商已创建。" : "Supplier created.");
      router.refresh();
    } catch {
      setMessage(zh ? "网络错误，请重试。" : "Network error. Please try again.");
    } finally {
      requestLock.current = false;
      setPending(false);
    }
  }
  return (
    <details className="mb-5 rounded-2xl border bg-white p-5">
      <summary className="cursor-pointer font-semibold">
        ＋ {zh ? "新增供应商" : "New supplier"}
      </summary>
      <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-3">
        <input
          name="code"
          required
          placeholder={zh ? "供应商编码" : "Supplier code"}
          className="rounded-lg border px-3 py-2"
        />
        <input
          name="name"
          required
          placeholder={zh ? "供应商名称" : "Supplier name"}
          className="rounded-lg border px-3 py-2"
        />
        <input
          name="countryCode"
          required
          minLength={2}
          maxLength={2}
          placeholder={zh ? "国家代码，如 CN" : "Country, e.g. CN"}
          className="rounded-lg border px-3 py-2 uppercase"
        />
        <input
          name="category"
          placeholder={zh ? "类别" : "Category"}
          className="rounded-lg border px-3 py-2"
        />
        <input
          name="contactName"
          placeholder={zh ? "联系人" : "Contact"}
          className="rounded-lg border px-3 py-2"
        />
        <input
          name="contactEmail"
          type="email"
          placeholder={zh ? "联系邮箱" : "Contact email"}
          className="rounded-lg border px-3 py-2"
        />
        <button
          disabled={pending}
          aria-busy={pending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (zh ? "创建中…" : "Creating…") : zh ? "创建" : "Create"}
        </button>
        {message && (
          <p role="status" className="self-center text-sm text-slate-600 md:col-span-2">
            {message}
          </p>
        )}
      </form>
    </details>
  );
}
