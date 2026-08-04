"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
type Factory = {
  id: string;
  code: string;
  name: string;
  countryCode: string;
  city: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  capabilities: string[];
  status: "ACTIVE" | "ON_HOLD" | "INACTIVE";
};
export function FactoryForm({ locale, factory }: { locale: Locale; factory?: Factory }) {
  const zh = locale === "zh-CN";
  const router = useRouter();
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function send(body: object, statusOnly = false) {
    if (lock.current) {
      return false;
    }
    lock.current = true;
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(factory ? `/api/factories/${factory.id}` : "/api/factories", {
        method: factory ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      setMessage(
        response.ok
          ? statusOnly
            ? zh
              ? "状态已更新。"
              : "Status updated."
            : zh
              ? "已保存。"
              : "Saved."
          : result.error === "DUPLICATE_FACTORY"
            ? zh
              ? "加工厂编码或名称重复。"
              : "Factory code or name already exists."
            : (result.error ?? (zh ? "保存失败。" : "Unable to save.")),
      );
      if (response.ok) {
        router.refresh();
      }
      return response.ok;
    } catch {
      setMessage(zh ? "网络错误，请重试。" : "Network error. Please try again.");
      return false;
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const saved = await send({
      ...data,
      capabilities: String(data.capabilities ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    });
    if (!factory && saved) {
      event.currentTarget.reset();
    }
  }
  const input = "rounded-lg border px-3 py-2";
  return (
    <section className="rounded-2xl border bg-white p-5">
      <form onSubmit={submit} className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-1 text-sm">
          {zh ? "加工厂编码" : "Factory code"}
          <input
            name="code"
            defaultValue={factory?.code}
            disabled={Boolean(factory)}
            required
            className={`${input} disabled:bg-slate-50`}
          />
        </label>
        <label className="grid gap-1 text-sm">
          {zh ? "加工厂名称" : "Factory name"}
          <input name="name" defaultValue={factory?.name} required className={input} />
        </label>
        <label className="grid gap-1 text-sm">
          {zh ? "国家代码" : "Country code"}
          <input
            name="countryCode"
            defaultValue={factory?.countryCode}
            minLength={2}
            maxLength={2}
            required
            className={input}
          />
        </label>
        <label className="grid gap-1 text-sm">
          {zh ? "城市" : "City"}
          <input name="city" defaultValue={factory?.city ?? ""} className={input} />
        </label>
        <label className="grid gap-1 text-sm">
          {zh ? "联系人" : "Contact"}
          <input name="contactName" defaultValue={factory?.contactName ?? ""} className={input} />
        </label>
        <label className="grid gap-1 text-sm">
          {zh ? "联系邮箱" : "Contact email"}
          <input
            name="contactEmail"
            type="email"
            defaultValue={factory?.contactEmail ?? ""}
            className={input}
          />
        </label>
        <label className="grid gap-1 text-sm">
          {zh ? "联系电话" : "Contact phone"}
          <input name="contactPhone" defaultValue={factory?.contactPhone ?? ""} className={input} />
        </label>
        <label className="grid gap-1 text-sm md:col-span-2">
          {zh ? "生产能力（英文逗号分隔）" : "Capabilities (comma separated)"}
          <input
            name="capabilities"
            defaultValue={factory?.capabilities.join(", ") ?? ""}
            placeholder={zh ? "针织, 梭织, 牛仔" : "Knit, Woven, Denim"}
            className={input}
          />
        </label>
        <button
          disabled={pending}
          aria-busy={pending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? zh
              ? "处理中…"
              : "Working…"
            : factory
              ? zh
                ? "保存资料"
                : "Save details"
              : zh
                ? "创建加工厂"
                : "Create factory"}
        </button>
      </form>
      {factory && (
        <div className="mt-4 flex gap-2">
          {(["ACTIVE", "ON_HOLD", "INACTIVE"] as const).map((status) => (
            <button
              key={status}
              type="button"
              disabled={pending}
              onClick={() => {
                if (
                  status === "INACTIVE" &&
                  !window.confirm(
                    zh
                      ? "确认删除（停用）该加工厂吗？历史业务数据会保留。"
                      : "Delete (deactivate) this factory? Historical data remains intact.",
                  )
                ) {
                  return;
                }
                void send({ status }, true);
              }}
              className={`rounded-lg border px-3 py-2 disabled:opacity-60 ${status === "INACTIVE" ? "border-red-200 text-red-600" : ""}`}
            >
              {status === "INACTIVE" ? (zh ? "删除（停用）" : "Delete (deactivate)") : status}
            </button>
          ))}
        </div>
      )}
      {message && (
        <p role="status" className="mt-3 text-sm text-slate-600">
          {message}
        </p>
      )}
    </section>
  );
}
