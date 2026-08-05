"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";

type Colorway = {
  id: string;
  colorCode: string;
  colorNameEn: string;
  colorNameZh: string;
  status: "ACTIVE" | "DISCONTINUED";
};

export function ColorwayManager({
  locale,
  styleId,
  colorways,
}: {
  locale: Locale;
  styleId: string;
  colorways: Colorway[];
}) {
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
    setMessage("");
    const form = event.currentTarget;
    try {
      const response = await fetch(`/api/styles/${styleId}/colorways`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const result = await response.json();
      setMessage(
        response.ok
          ? zh
            ? "色号已添加。"
            : "Colorway added."
          : result.error === "DUPLICATE_COLORWAY"
            ? zh
              ? "该款式已有相同色号。"
              : "Colorway code already exists for this style."
            : (result.error ?? (zh ? "添加失败。" : "Unable to add.")),
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

  async function toggleStatus(colorway: Colorway) {
    if (lock.current) {
      return;
    }
    lock.current = true;
    setPending(true);
    const nextStatus = colorway.status === "ACTIVE" ? "DISCONTINUED" : "ACTIVE";
    try {
      const response = await fetch(`/api/styles/${styleId}/colorways/${colorway.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (response.ok) {
        router.refresh();
      }
    } finally {
      lock.current = false;
      setPending(false);
    }
  }

  const input = "rounded-lg border px-3 py-2";
  return (
    <section className="mt-6 rounded-2xl border bg-white">
      <h2 className="border-b p-5 text-lg font-semibold">{zh ? "色号" : "Colorways"}</h2>
      <form onSubmit={submit} className="grid gap-3 p-5 md:grid-cols-4">
        <input
          name="colorCode"
          required
          placeholder={zh ? "色号编码" : "Color code"}
          className={input}
        />
        <input
          name="colorNameEn"
          required
          placeholder={zh ? "英文颜色名" : "Color name (EN)"}
          className={input}
        />
        <input
          name="colorNameZh"
          required
          placeholder={zh ? "中文颜色名" : "Color name (ZH)"}
          className={input}
        />
        <button
          disabled={pending}
          aria-busy={pending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (zh ? "处理中…" : "Working…") : zh ? "添加色号" : "Add colorway"}
        </button>
        {message && (
          <p role="status" className="text-sm text-slate-600 md:col-span-4">
            {message}
          </p>
        )}
      </form>
      {colorways.length === 0 ? (
        <p className="p-6 text-sm text-slate-500">{zh ? "暂无色号。" : "No colorways yet."}</p>
      ) : (
        <ul className="divide-y">
          {colorways.map((colorway) => (
            <li key={colorway.id} className="grid items-center gap-2 p-4 text-sm md:grid-cols-4">
              <strong>{colorway.colorCode}</strong>
              <span>{zh ? colorway.colorNameZh : colorway.colorNameEn}</span>
              <span>
                {colorway.status === "ACTIVE"
                  ? zh
                    ? "启用"
                    : "Active"
                  : zh
                    ? "停用"
                    : "Discontinued"}
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() => void toggleStatus(colorway)}
                className="justify-self-start rounded-lg border px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-60"
              >
                {colorway.status === "ACTIVE"
                  ? zh
                    ? "停用"
                    : "Discontinue"
                  : zh
                    ? "重新启用"
                    : "Reactivate"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
