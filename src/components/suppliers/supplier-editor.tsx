"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";

type Supplier = {
  id: string;
  code: string;
  name: string;
  countryCode: string;
  category: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  status: "ACTIVE" | "SUSPENDED" | "INACTIVE";
};
export function SupplierEditor({ supplier, locale }: { supplier: Supplier; locale: Locale }) {
  const zh = locale === "zh-CN";
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const requestLock = useRef(false);
  async function send(path: string, method: "POST" | "PATCH", body: object, success: string) {
    if (requestLock.current) {
      return;
    }
    requestLock.current = true;
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(path, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      setMessage(response.ok ? success : (result.error ?? (zh ? "保存失败。" : "Unable to save.")));
      if (response.ok) {
        router.refresh();
      }
    } catch {
      setMessage(zh ? "网络错误，请重试。" : "Network error. Please try again.");
    } finally {
      requestLock.current = false;
      setPending(false);
    }
  }
  async function edit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await send(
      `/api/suppliers/${supplier.id}`,
      "PATCH",
      Object.fromEntries(new FormData(event.currentTarget)),
      zh ? "已保存。" : "Saved.",
    );
  }
  async function status(value: Supplier["status"]) {
    await send(
      `/api/suppliers/${supplier.id}`,
      "PATCH",
      { status: value },
      zh ? "状态已更新。" : "Status updated.",
    );
  }
  async function certification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await send(
      `/api/suppliers/${supplier.id}/certifications`,
      "POST",
      Object.fromEntries(new FormData(event.currentTarget)),
      zh ? "认证已添加。" : "Certification added.",
    );
  }
  const input = "rounded-lg border px-3 py-2";
  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border bg-white p-6">
        <form onSubmit={edit} className="grid gap-3 md:grid-cols-2">
          <input value={supplier.code} disabled className={`${input} bg-slate-50`} />
          <input name="name" defaultValue={supplier.name} required className={input} />
          <input
            name="countryCode"
            defaultValue={supplier.countryCode}
            required
            minLength={2}
            maxLength={2}
            className={input}
          />
          <input
            name="category"
            defaultValue={supplier.category ?? ""}
            placeholder={zh ? "类别" : "Category"}
            className={input}
          />
          <input
            name="contactName"
            defaultValue={supplier.contactName ?? ""}
            placeholder={zh ? "联系人" : "Contact"}
            className={input}
          />
          <input
            name="contactEmail"
            type="email"
            defaultValue={supplier.contactEmail ?? ""}
            placeholder={zh ? "邮箱" : "Email"}
            className={input}
          />
          <input
            name="contactPhone"
            defaultValue={supplier.contactPhone ?? ""}
            placeholder={zh ? "电话" : "Phone"}
            className={input}
          />
          <button
            disabled={pending}
            aria-busy={pending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? (zh ? "处理中…" : "Working…") : zh ? "保存资料" : "Save details"}
          </button>
        </form>
        <div className="mt-4 flex gap-2">
          <button
            disabled={pending}
            onClick={() => void status("ACTIVE")}
            className="rounded-lg border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {zh ? "启用" : "Activate"}
          </button>
          <button
            disabled={pending}
            onClick={() => void status("SUSPENDED")}
            className="rounded-lg border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {zh ? "暂停" : "Suspend"}
          </button>
          <button
            disabled={pending}
            onClick={() => {
              if (
                window.confirm(
                  zh
                    ? "确认删除（停用）该供应商吗？历史业务数据和认证记录会保留。"
                    : "Delete (deactivate) this supplier? Historical and certification data remains intact.",
                )
              ) {
                void status("INACTIVE");
              }
            }}
            className="rounded-lg border border-red-200 px-3 py-2 text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {zh ? "删除（停用）" : "Delete (deactivate)"}
          </button>
        </div>
        {message && (
          <p role="status" className="mt-3 text-sm text-slate-600">
            {message}
          </p>
        )}
      </section>
      <section className="rounded-2xl border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">{zh ? "添加认证" : "Add certification"}</h2>
        <form onSubmit={certification} className="grid gap-3 md:grid-cols-3">
          <input
            name="certificationType"
            required
            placeholder={zh ? "认证类型" : "Certification type"}
            className={input}
          />
          <input
            name="certificateNumber"
            placeholder={zh ? "证书编号" : "Certificate number"}
            className={input}
          />
          <input name="issuedBy" placeholder={zh ? "签发机构" : "Issued by"} className={input} />
          <label className="grid gap-1 text-sm">
            {zh ? "生效日期" : "Valid from"}
            <input name="validFrom" type="date" className={input} />
          </label>
          <label className="grid gap-1 text-sm">
            {zh ? "到期日期" : "Expiry date"}
            <input name="expiresAt" type="date" required className={input} />
          </label>
          <button
            disabled={pending}
            aria-busy={pending}
            className="self-end rounded-lg bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? (zh ? "处理中…" : "Working…") : zh ? "添加认证" : "Add certification"}
          </button>
        </form>
      </section>
    </div>
  );
}
