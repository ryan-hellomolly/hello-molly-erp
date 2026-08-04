"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { TemplateActions } from "@/components/templates/template-actions";
import type { Locale } from "@/i18n/config";
import type { Kind } from "./reference-manager";

type Row = {
  id: string;
  nameEn: string;
  nameZh: string;
  active: boolean;
};

export function SimpleReferenceManager({
  locale,
  kind,
  rows,
  canManage,
}: {
  locale: Locale;
  kind: Kind;
  rows: Row[];
  canManage: boolean;
}) {
  const zh = locale === "zh-CN";
  const router = useRouter();
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState<Row | null>(null);

  async function request(path: string, method: "POST" | "DELETE", body?: object) {
    if (lock.current) {
      return false;
    }
    lock.current = true;
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(path, {
        method,
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const result = await response.json();
      setMessage(
        response.ok
          ? zh
            ? method === "DELETE"
              ? "已删除。"
              : "已添加。"
            : method === "DELETE"
              ? "Deleted."
              : "Added."
          : (result.error ?? (zh ? "操作失败。" : "Unable to complete the action.")),
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
    const form = event.currentTarget;
    const name = String(new FormData(form).get("name") ?? "").trim();
    if (!name) {
      return;
    }
    const code = `${kind.slice(0, 12)}-${crypto.randomUUID().slice(0, 8)}`.toUpperCase();
    if (
      await request("/api/reference-data", "POST", {
        type: kind,
        code,
        nameZh: name,
        nameEn: name,
      })
    ) {
      form.reset();
    }
  }

  async function remove() {
    if (!deleting) {
      return;
    }
    if (await request(`/api/reference-data/${deleting.id}`, "DELETE")) {
      setDeleting(null);
    }
  }

  const visibleRows = rows.filter(({ active }) => active);
  return (
    <>
      <section className="rounded-2xl border bg-white p-5">
        {canManage ? (
          <form onSubmit={submit} className="mb-5 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              name="name"
              required
              maxLength={120}
              placeholder={zh ? "请输入名称" : "Enter name"}
              aria-label={zh ? "名称" : "Name"}
              className="rounded-lg border px-3 py-2"
            />
            <button
              disabled={pending}
              aria-busy={pending}
              className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white disabled:opacity-60"
            >
              {pending ? (zh ? "处理中…" : "Working…") : zh ? "添加" : "Add"}
            </button>
          </form>
        ) : null}
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3">{zh ? "名称" : "Name"}</th>
              {canManage ? <th className="w-24 p-3">{zh ? "操作" : "Actions"}</th> : null}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-3 font-medium">{zh ? row.nameZh : row.nameEn}</td>
                {canManage ? (
                  <td className="p-3">
                    <TemplateActions
                      deleteLabel={zh ? "删除" : "Delete"}
                      disabled={pending}
                      onDelete={() => setDeleting(row)}
                    />
                  </td>
                ) : null}
              </tr>
            ))}
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 2 : 1} className="p-8 text-center text-slate-400">
                  {zh ? "暂无数据" : "No records yet"}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        {message ? (
          <p role="status" className="mt-3 text-sm text-slate-600">
            {message}
          </p>
        ) : null}
      </section>
      {deleting ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="simple-reference-delete-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 id="simple-reference-delete-title" className="text-lg font-semibold">
              {zh ? "确认删除" : "Delete this item?"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {zh
                ? `确定删除“${deleting.nameZh}”吗？历史业务数据不会受到影响。`
                : `Delete “${deleting.nameEn}”? Historical business data will remain intact.`}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={pending}
                onClick={() => setDeleting(null)}
                className="rounded-lg border px-4 py-2 disabled:opacity-50"
              >
                {zh ? "取消" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={pending}
                aria-busy={pending}
                onClick={() => void remove()}
                className="rounded-lg bg-red-600 px-4 py-2 text-white disabled:opacity-50"
              >
                {pending ? (zh ? "删除中…" : "Deleting…") : zh ? "确认删除" : "Delete"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
