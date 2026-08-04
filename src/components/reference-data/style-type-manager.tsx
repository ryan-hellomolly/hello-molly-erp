"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
import { buildReferenceTree } from "./reference-tree";

type Row = {
  id: string;
  code: string;
  nameEn: string;
  nameZh: string;
  symbol: string | null;
  parentId: string | null;
  active: boolean;
};

export function StyleTypeManager({
  locale,
  rows,
  canManage,
}: {
  locale: Locale;
  rows: Row[];
  canManage: boolean;
}) {
  const zh = locale === "zh-CN";
  const router = useRouter();
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState<{ parentId: string | null } | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);

  async function request(path: string, method: "POST" | "PATCH" | "DELETE", body?: object) {
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
            ? "已保存。"
            : "Saved."
          : result.error === "DUPLICATE_REFERENCE"
            ? zh
              ? "编码重复，请重试。"
              : "Code already exists. Please try again."
            : result.error === "HAS_ACTIVE_CHILDREN"
              ? zh
                ? "请先删除或停用其子级。"
                : "Delete or deactivate its children first."
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

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!creating) {
      return;
    }
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const prefix = String(form.get("prefix") ?? "").trim();
    if (!name) {
      return;
    }
    const code = `STYLE_TYPE-${crypto.randomUUID().slice(0, 8)}`.toUpperCase();
    if (
      await request("/api/reference-data", "POST", {
        type: "STYLE_TYPE",
        code,
        nameZh: name,
        nameEn: name,
        symbol: prefix || undefined,
        parentId: creating.parentId ?? undefined,
      })
    ) {
      setCreating(null);
    }
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) {
      return;
    }
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const prefix = String(form.get("prefix") ?? "").trim();
    if (!name) {
      return;
    }
    if (
      await request(`/api/reference-data/${editing.id}`, "PATCH", {
        type: "STYLE_TYPE",
        code: editing.code,
        nameZh: name,
        nameEn: name,
        symbol: prefix || undefined,
        parentId: editing.parentId ?? undefined,
      })
    ) {
      setEditing(null);
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

  const tree = buildReferenceTree(rows.filter((row) => row.active));
  const input = "rounded-lg border px-3 py-2";

  return (
    <>
      {canManage && (
        <div className="mb-4">
          <button
            onClick={() => setCreating({ parentId: null })}
            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white"
          >
            ＋ {zh ? "新建" : "New"}
          </button>
        </div>
      )}
      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3">{zh ? "名称" : "Name"}</th>
              <th className="px-4 py-3">{zh ? "前缀" : "Prefix"}</th>
              {canManage && <th className="px-4 py-3">{zh ? "操作" : "Actions"}</th>}
            </tr>
          </thead>
          <tbody>
            {tree.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-4 py-3">
                  <span style={{ paddingLeft: `${row.depth * 1.5}rem` }}>
                    {zh ? row.nameZh : row.nameEn}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{row.symbol ?? "—"}</td>
                {canManage && (
                  <td className="space-x-3 px-4 py-3">
                    <button
                      onClick={() => setCreating({ parentId: row.id })}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {zh ? "添加子级" : "Add child"}
                    </button>
                    <button
                      onClick={() => setEditing(row)}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {zh ? "编辑" : "Edit"}
                    </button>
                    <button
                      onClick={() => setDeleting(row)}
                      className="font-medium text-red-600 hover:underline"
                    >
                      {zh ? "删除" : "Delete"}
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {tree.length === 0 && (
              <tr>
                <td colSpan={canManage ? 3 : 2} className="p-8 text-center text-slate-400">
                  {zh ? "暂无数据" : "No records yet"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {message && (
        <p role="status" className="mt-3 text-sm text-slate-600">
          {message}
        </p>
      )}
      {creating && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/45 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-style-type-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 id="create-style-type-title" className="text-lg font-semibold">
              {creating.parentId
                ? zh
                  ? "添加子级"
                  : "Add child"
                : zh
                  ? "新建款式类型"
                  : "New style type"}
            </h2>
            <form onSubmit={submitCreate} className="mt-4 grid gap-3">
              <label className="grid gap-1 text-sm">
                {zh ? "名称" : "Name"}
                <input name="name" required maxLength={120} className={input} />
              </label>
              <label className="grid gap-1 text-sm">
                {zh ? "前缀" : "Prefix"}
                <input name="prefix" maxLength={12} className={input} />
              </label>
              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setCreating(null)}
                  className="rounded-lg border px-4 py-2 disabled:opacity-50"
                >
                  {zh ? "取消" : "Cancel"}
                </button>
                <button
                  disabled={pending}
                  aria-busy={pending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                >
                  {pending ? (zh ? "保存中…" : "Saving…") : zh ? "创建" : "Create"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {editing && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/45 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-style-type-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 id="edit-style-type-title" className="text-lg font-semibold">
              {zh ? "编辑款式类型" : "Edit style type"}
            </h2>
            <form onSubmit={submitEdit} className="mt-4 grid gap-3">
              <label className="grid gap-1 text-sm">
                {zh ? "名称" : "Name"}
                <input
                  name="name"
                  required
                  maxLength={120}
                  defaultValue={zh ? editing.nameZh : editing.nameEn}
                  className={input}
                />
              </label>
              <label className="grid gap-1 text-sm">
                {zh ? "前缀" : "Prefix"}
                <input
                  name="prefix"
                  maxLength={12}
                  defaultValue={editing.symbol ?? ""}
                  className={input}
                />
              </label>
              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setEditing(null)}
                  className="rounded-lg border px-4 py-2 disabled:opacity-50"
                >
                  {zh ? "取消" : "Cancel"}
                </button>
                <button
                  disabled={pending}
                  aria-busy={pending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                >
                  {pending ? (zh ? "保存中…" : "Saving…") : zh ? "保存" : "Save"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {deleting && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/45 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-style-type-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 id="delete-style-type-title" className="text-lg font-semibold">
              {zh ? "确认删除" : "Delete this style type?"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {zh
                ? `确定删除“${deleting.nameZh}”吗？如果它有子级，请先删除或停用子级。`
                : `Delete “${deleting.nameEn}”? If it has children, delete or deactivate them first.`}
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
      )}
    </>
  );
}
