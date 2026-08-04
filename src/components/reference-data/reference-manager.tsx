"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
import { TemplateActions } from "@/components/templates/template-actions";
export type Kind =
  | "SIZE"
  | "UNIT"
  | "CURRENCY"
  | "TRADE_TERM"
  | "SETTLEMENT_METHOD"
  | "INVOICE_TYPE"
  | "SAMPLE_TYPE"
  | "EXPENSE_TYPE"
  | "SALES_CHANNEL"
  | "STYLE_TYPE"
  | "SEASON"
  | "YEAR"
  | "STAGE"
  | "PROCESSING_TYPE"
  | "WASH_TYPE"
  | "FABRIC_TRIM_TYPE"
  | "EXECUTION_STANDARD";
type Row = {
  id: string;
  type: Kind;
  code: string;
  nameEn: string;
  nameZh: string;
  category: string | null;
  symbol: string | null;
  sortOrder: number;
  decimalPlaces: number;
  active: boolean;
};
export function ReferenceManager({
  locale,
  rows,
  canManage,
  kinds,
  fixedCategory,
}: {
  locale: Locale;
  rows: Row[];
  canManage: boolean;
  kinds?: readonly Kind[];
  fixedCategory?: string;
}) {
  const zh = locale === "zh-CN";
  const router = useRouter();
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
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
              ? "该类型下编码重复。"
              : "Code already exists for this type."
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
    const form = event.currentTarget;
    if (await request("/api/reference-data", "POST", Object.fromEntries(new FormData(form)))) {
      form.reset();
    }
  }
  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) {
      return;
    }
    if (
      await request(
        `/api/reference-data/${editing.id}`,
        "PATCH",
        Object.fromEntries(new FormData(event.currentTarget)),
      )
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
  const groups = kinds ?? (["SIZE", "UNIT", "CURRENCY", "TRADE_TERM"] as const);
  const input = "rounded-lg border px-3 py-2";
  return (
    <>
      {canManage && (
        <details className="mb-5 rounded-2xl border bg-white p-5">
          <summary className="cursor-pointer font-semibold">
            ＋ {zh ? "新增字典项" : "New reference value"}
          </summary>
          <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-4">
            {groups.length === 1 ? (
              <input type="hidden" name="type" value={groups[0]} />
            ) : (
              <select name="type" className={input}>
                {groups.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            )}
            <input name="code" required placeholder={zh ? "编码" : "Code"} className={input} />
            <input name="nameZh" required placeholder="中文名称" className={input} />
            <input name="nameEn" required placeholder="English name" className={input} />
            {fixedCategory ? (
              <input type="hidden" name="category" value={fixedCategory} />
            ) : (
              <input
                name="category"
                placeholder={zh ? "单位类别（单位必填）" : "Unit category (required for units)"}
                className={input}
              />
            )}
            <input name="symbol" placeholder={zh ? "符号" : "Symbol"} className={input} />
            <input
              name="sortOrder"
              type="number"
              min="0"
              defaultValue="0"
              placeholder={zh ? "排序" : "Sort order"}
              className={input}
            />
            <input
              name="decimalPlaces"
              type="number"
              min="0"
              max="6"
              defaultValue="0"
              placeholder={zh ? "小数位" : "Decimal places"}
              className={input}
            />
            <button
              disabled={pending}
              aria-busy={pending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
            >
              {pending ? (zh ? "保存中…" : "Saving…") : zh ? "创建" : "Create"}
            </button>
          </form>
          {message && (
            <p role="status" className="mt-3 text-sm text-slate-600">
              {message}
            </p>
          )}
        </details>
      )}
      {groups.map((kind) => (
        <section key={kind} className="mb-6 rounded-2xl border bg-white">
          <h2 className="border-b p-5 text-lg font-semibold">{kind}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3">{zh ? "顺序" : "Order"}</th>
                  <th className="px-4 py-3">{zh ? "编码" : "Code"}</th>
                  <th className="px-4 py-3">中文</th>
                  <th className="px-4 py-3">English</th>
                  <th className="px-4 py-3">{zh ? "附加信息" : "Details"}</th>
                  <th className="px-4 py-3">{zh ? "状态" : "Status"}</th>
                  {canManage && <th className="px-4 py-3">{zh ? "操作" : "Actions"}</th>}
                </tr>
              </thead>
              <tbody>
                {rows
                  .filter((row) => row.type === kind)
                  .map((row) => (
                    <tr key={row.id} className="border-t">
                      <td className="px-4 py-3">{row.sortOrder}</td>
                      <td className="px-4 py-3 font-medium">{row.code}</td>
                      <td className="px-4 py-3">{row.nameZh}</td>
                      <td className="px-4 py-3">{row.nameEn}</td>
                      <td className="px-4 py-3">
                        {row.category ??
                          row.symbol ??
                          (kind === "CURRENCY" ? `${row.decimalPlaces} dp` : "—")}
                      </td>
                      {canManage && (
                        <td className="px-4 py-3">
                          <TemplateActions
                            editLabel={zh ? "编辑" : "Edit"}
                            deleteLabel={zh ? "删除（停用）" : "Delete (deactivate)"}
                            disabled={pending || !row.active}
                            onEdit={() => setEditing(row)}
                            onDelete={() => setDeleting(row)}
                          />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        {canManage ? (
                          <button
                            disabled={pending}
                            onClick={() =>
                              void request(`/api/reference-data/${row.id}`, "PATCH", {
                                active: !row.active,
                              })
                            }
                            className="rounded-lg border px-3 py-1.5 disabled:opacity-60"
                          >
                            {row.active ? (zh ? "启用" : "Active") : zh ? "停用" : "Inactive"}
                          </button>
                        ) : row.active ? (
                          "ACTIVE"
                        ) : (
                          "INACTIVE"
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      {editing && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-reference-title"
            className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 id="edit-reference-title" className="text-lg font-semibold">
              {zh ? "编辑字典项" : "Edit reference value"}
            </h2>
            <form onSubmit={update} className="mt-5 grid gap-3 md:grid-cols-2">
              <input type="hidden" name="type" value={editing.type} />
              <label className="grid gap-1 text-sm">
                {zh ? "编码" : "Code"}
                <input name="code" defaultValue={editing.code} required className={input} />
              </label>
              <label className="grid gap-1 text-sm">
                中文名称
                <input name="nameZh" defaultValue={editing.nameZh} required className={input} />
              </label>
              <label className="grid gap-1 text-sm">
                English name
                <input name="nameEn" defaultValue={editing.nameEn} required className={input} />
              </label>
              {fixedCategory ? (
                <input type="hidden" name="category" value={fixedCategory} />
              ) : (
                <label className="grid gap-1 text-sm">
                  {zh ? "类别" : "Category"}
                  <input name="category" defaultValue={editing.category ?? ""} className={input} />
                </label>
              )}
              <label className="grid gap-1 text-sm">
                {zh ? "符号" : "Symbol"}
                <input name="symbol" defaultValue={editing.symbol ?? ""} className={input} />
              </label>
              <label className="grid gap-1 text-sm">
                {zh ? "排序" : "Sort order"}
                <input
                  name="sortOrder"
                  type="number"
                  min="0"
                  defaultValue={editing.sortOrder}
                  className={input}
                />
              </label>
              <label className="grid gap-1 text-sm">
                {zh ? "小数位" : "Decimal places"}
                <input
                  name="decimalPlaces"
                  type="number"
                  min="0"
                  max="6"
                  defaultValue={editing.decimalPlaces}
                  className={input}
                />
              </label>
              <div className="flex justify-end gap-3 md:col-span-2">
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
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-reference-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 id="delete-reference-title" className="text-lg font-semibold">
              {zh ? "确认删除" : "Delete reference value?"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {zh
                ? `“${deleting.nameZh}”将被停用，不再出现在新业务选择中；历史单据不会受影响，并可稍后重新启用。`
                : `“${deleting.nameEn}” will be deactivated for new transactions. Historical records remain intact and the value can be restored later.`}
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
                {pending ? (zh ? "处理中…" : "Deleting…") : zh ? "确认删除" : "Delete"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
