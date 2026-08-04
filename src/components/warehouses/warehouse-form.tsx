"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
type Warehouse = {
  id: string;
  code: string;
  name: string;
  countryCode: string;
  city: string | null;
  address: string | null;
  ownership: "HELLO_MOLLY" | "THIRD_PARTY" | "FACTORY" | "SUPPLIER";
  ownerName: string | null;
  status: "ACTIVE" | "INACTIVE";
};
export function WarehouseForm({ locale, warehouse }: { locale: Locale; warehouse?: Warehouse }) {
  const zh = locale === "zh-CN";
  const router = useRouter();
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function send(path: string, method: "POST" | "PATCH", body: object) {
    if (lock.current) {
      return false;
    }
    lock.current = true;
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(path, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      setMessage(
        response.ok
          ? zh
            ? "已保存。"
            : "Saved."
          : result.error === "DUPLICATE_WAREHOUSE"
            ? zh
              ? "仓库编码重复。"
              : "Warehouse code already exists."
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
    const saved = await send(
      warehouse ? `/api/warehouses/${warehouse.id}` : "/api/warehouses",
      warehouse ? "PATCH" : "POST",
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!warehouse && saved) {
      event.currentTarget.reset();
    }
  }
  const input = "rounded-lg border px-3 py-2";
  return (
    <section className="rounded-2xl border bg-white p-5">
      <form onSubmit={submit} className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-1 text-sm">
          {zh ? "仓库编码" : "Warehouse code"}
          <input
            name="code"
            defaultValue={warehouse?.code}
            disabled={Boolean(warehouse)}
            required
            className={`${input} disabled:bg-slate-50`}
          />
        </label>
        <label className="grid gap-1 text-sm">
          {zh ? "仓库名称" : "Warehouse name"}
          <input name="name" defaultValue={warehouse?.name} required className={input} />
        </label>
        <label className="grid gap-1 text-sm">
          {zh ? "国家代码" : "Country code"}
          <input
            name="countryCode"
            defaultValue={warehouse?.countryCode}
            required
            minLength={2}
            maxLength={2}
            className={input}
          />
        </label>
        <label className="grid gap-1 text-sm">
          {zh ? "城市" : "City"}
          <input name="city" defaultValue={warehouse?.city ?? ""} className={input} />
        </label>
        <label className="grid gap-1 text-sm">
          {zh ? "归属类型" : "Ownership"}
          <select
            name="ownership"
            defaultValue={warehouse?.ownership ?? "HELLO_MOLLY"}
            className={input}
          >
            {["HELLO_MOLLY", "THIRD_PARTY", "FACTORY", "SUPPLIER"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          {zh ? "外部所有者名称" : "External owner name"}
          <input name="ownerName" defaultValue={warehouse?.ownerName ?? ""} className={input} />
        </label>
        <label className="grid gap-1 text-sm md:col-span-2">
          {zh ? "地址" : "Address"}
          <input name="address" defaultValue={warehouse?.address ?? ""} className={input} />
        </label>
        <button
          disabled={pending}
          aria-busy={pending}
          className="self-end rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
        >
          {pending
            ? zh
              ? "处理中…"
              : "Working…"
            : warehouse
              ? zh
                ? "保存资料"
                : "Save details"
              : zh
                ? "创建仓库"
                : "Create warehouse"}
        </button>
      </form>
      {warehouse && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              void send(`/api/warehouses/${warehouse.id}`, "PATCH", { status: "ACTIVE" })
            }
            className="rounded-lg border px-3 py-2 disabled:opacity-60"
          >
            ACTIVE
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (
                window.confirm(
                  zh
                    ? "确认删除（停用）该仓库吗？历史库存记录和库位会保留。"
                    : "Delete (deactivate) this warehouse? Historical inventory and locations remain intact.",
                )
              ) {
                void send(`/api/warehouses/${warehouse.id}`, "PATCH", { status: "INACTIVE" });
              }
            }}
            className="rounded-lg border border-red-200 px-3 py-2 text-red-600 disabled:opacity-60"
          >
            {zh ? "删除（停用）" : "Delete (deactivate)"}
          </button>
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
export function LocationForm({ locale, warehouseId }: { locale: Locale; warehouseId: string }) {
  const zh = locale === "zh-CN";
  const router = useRouter();
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) {
      return;
    }
    lock.current = true;
    setPending(true);
    const form = event.currentTarget;
    try {
      const response = await fetch(`/api/warehouses/${warehouseId}/locations`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const result = await response.json();
      setMessage(
        response.ok
          ? zh
            ? "库位已添加。"
            : "Location added."
          : result.error === "DUPLICATE_LOCATION"
            ? zh
              ? "该仓库已有相同库位编码。"
              : "Location code already exists in this warehouse."
            : result.error,
      );
      if (response.ok) {
        form.reset();
        router.refresh();
      }
    } catch {
      setMessage(zh ? "网络错误，请重试。" : "Network error. Please try again.");
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  const input = "rounded-lg border px-3 py-2";
  return (
    <form onSubmit={submit} className="grid gap-3 p-5 md:grid-cols-4">
      <input
        name="code"
        required
        placeholder={zh ? "库位编码" : "Location code"}
        className={input}
      />
      <input name="name" placeholder={zh ? "库位名称" : "Location name"} className={input} />
      <input name="zone" placeholder={zh ? "区域" : "Zone"} className={input} />
      <button
        disabled={pending}
        className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
      >
        {pending ? (zh ? "添加中…" : "Adding…") : zh ? "添加库位" : "Add location"}
      </button>
      {message && (
        <p role="status" className="text-sm text-slate-600 md:col-span-4">
          {message}
        </p>
      )}
    </form>
  );
}
