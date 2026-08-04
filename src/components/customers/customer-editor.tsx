"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";

type Customer = {
  id: string;
  code: string;
  name: string;
  countryCode: string;
  salesChannel: string | null;
  ownerName: string | null;
  status: "ACTIVE" | "INACTIVE";
};

export function CustomerEditor({ customer, locale }: { customer: Customer; locale: Locale }) {
  const zh = locale === "zh-CN";
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const requestLock = useRef(false);

  async function patch(body: object) {
    if (requestLock.current) {
      return;
    }
    requestLock.current = true;
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(
          result.error === "DUPLICATE_CUSTOMER"
            ? zh
              ? "同一国家/地区已存在同名客户。"
              : "A customer with this name already exists in that country."
            : zh
              ? "保存失败，请检查输入。"
              : "Unable to save. Check the input.",
        );
        return;
      }
      setMessage(zh ? "已保存。" : "Saved.");
      router.refresh();
    } catch {
      setMessage(zh ? "网络错误，请重试。" : "Network error. Please try again.");
    } finally {
      requestLock.current = false;
      setPending(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await patch({
      name: form.get("name"),
      countryCode: form.get("countryCode"),
      salesChannel: form.get("salesChannel") || undefined,
      ownerName: form.get("ownerName") || undefined,
    });
  }

  return (
    <section className="rounded-2xl border bg-white p-6">
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span>{zh ? "客户编码（不可修改）" : "Customer code (read only)"}</span>
          <input
            value={customer.code}
            disabled
            className="rounded-lg border bg-slate-50 px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span>{zh ? "客户名称" : "Customer name"}</span>
          <input
            name="name"
            defaultValue={customer.name}
            required
            minLength={2}
            className="rounded-lg border px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span>{zh ? "国家/地区代码" : "Country code"}</span>
          <input
            name="countryCode"
            defaultValue={customer.countryCode}
            required
            minLength={2}
            maxLength={2}
            className="rounded-lg border px-3 py-2 uppercase"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span>{zh ? "销售渠道" : "Sales channel"}</span>
          <input
            name="salesChannel"
            defaultValue={customer.salesChannel ?? ""}
            className="rounded-lg border px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span>{zh ? "负责人" : "Owner"}</span>
          <input
            name="ownerName"
            defaultValue={customer.ownerName ?? ""}
            className="rounded-lg border px-3 py-2"
          />
        </label>
        <div className="flex items-end gap-3">
          <button
            disabled={pending}
            aria-busy={pending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? (zh ? "保存中…" : "Saving…") : zh ? "保存修改" : "Save changes"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              const deleting = customer.status === "ACTIVE";
              if (
                deleting &&
                !window.confirm(
                  zh
                    ? "确认删除（停用）该客户吗？历史业务数据会保留，并可稍后重新启用。"
                    : "Delete (deactivate) this customer? Historical data remains intact and it can be restored later.",
                )
              ) {
                return;
              }
              void patch({ status: deleting ? "INACTIVE" : "ACTIVE" });
            }}
            className="rounded-lg border border-red-200 px-4 py-2 text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {customer.status === "ACTIVE"
              ? zh
                ? "删除（停用）"
                : "Delete (deactivate)"
              : zh
                ? "重新启用"
                : "Reactivate"}
          </button>
        </div>
      </form>
      {message && (
        <p role="status" className="mt-4 text-sm text-slate-600">
          {message}
        </p>
      )}
    </section>
  );
}
