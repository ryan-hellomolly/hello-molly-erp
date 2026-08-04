"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
export type TemplateKind = "SAMPLE" | "MEASUREMENT" | "CONSTRUCTION";
type Row = {
  id: string;
  type: TemplateKind;
  code: string;
  version: number;
  nameEn: string;
  nameZh: string;
  content: unknown;
  status: "DRAFT" | "PUBLISHED" | "RETIRED";
  publishedAt: Date | string | null;
};
export function TemplateManager({
  locale,
  rows,
  canManage,
  types = ["SAMPLE", "MEASUREMENT", "CONSTRUCTION"],
}: {
  locale: Locale;
  rows: Row[];
  canManage: boolean;
  types?: readonly TemplateKind[];
}) {
  const zh = locale === "zh-CN";
  const router = useRouter();
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function request(path: string, method: "POST" | "PATCH", body: object) {
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
          : result.error === "DUPLICATE_TEMPLATE_VERSION"
            ? zh
              ? "该类型、编码和版本已经存在。"
              : "Template type, code and version already exist."
            : result.error === "INVALID_TEMPLATE_TRANSITION"
              ? zh
                ? "不允许此状态变更。"
                : "This status transition is not allowed."
              : (result.error ?? (zh ? "保存失败。" : "Unable to save.")),
      );
      if (response.ok) {
        router.refresh();
      }
      return response.ok;
    } catch {
      setMessage(zh ? "网络错误或 JSON 内容无效。" : "Network error or invalid JSON content.");
      return false;
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    try {
      const content = JSON.parse(String(values.content));
      if (await request("/api/templates", "POST", { ...values, content })) {
        form.reset();
      }
    } catch {
      setMessage(zh ? "模板内容必须是有效 JSON。" : "Template content must be valid JSON.");
    }
  }
  const groups = types;
  const input = "rounded-lg border px-3 py-2";
  return (
    <>
      {canManage && (
        <details className="mb-5 rounded-2xl border bg-white p-5">
          <summary className="cursor-pointer font-semibold">
            ＋ {zh ? "新建模板版本" : "New template version"}
          </summary>
          <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-4">
            {groups.length === 1 ? (
              <>
                <input type="hidden" name="type" value={groups[0]} />
                <div className={`${input} bg-slate-50 text-slate-600`}>{groups[0]}</div>
              </>
            ) : (
              <select name="type" className={input}>
                {groups.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            )}
            <input
              name="code"
              required
              placeholder={zh ? "模板编码" : "Template code"}
              className={input}
            />
            <input
              name="version"
              type="number"
              min="1"
              defaultValue="1"
              required
              className={input}
            />
            <input name="nameZh" required placeholder="中文名称" className={input} />
            <input name="nameEn" required placeholder="English name" className={input} />
            <input
              name="description"
              placeholder={zh ? "说明" : "Description"}
              className={`${input} md:col-span-3`}
            />
            <textarea
              name="content"
              required
              defaultValue={'{"sections":[]}'}
              className={`${input} min-h-28 font-mono text-xs md:col-span-4`}
            />
            <button
              disabled={pending}
              aria-busy={pending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
            >
              {pending ? (zh ? "保存中…" : "Saving…") : zh ? "创建草稿" : "Create draft"}
            </button>
          </form>
          {message && (
            <p role="status" className="mt-3 text-sm text-slate-600">
              {message}
            </p>
          )}
        </details>
      )}
      {groups.map((type) => (
        <section key={type} className="mb-6 rounded-2xl border bg-white">
          <h2 className="border-b p-5 text-lg font-semibold">{type}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    zh ? "编码" : "Code",
                    zh ? "版本" : "Version",
                    zh ? "名称" : "Name",
                    zh ? "内容" : "Content",
                    zh ? "状态" : "Status",
                    zh ? "操作" : "Actions",
                  ].map((x) => (
                    <th key={x} className="px-4 py-3">
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows
                  .filter((row) => row.type === type)
                  .map((row) => (
                    <tr key={row.id} className="border-t">
                      <td className="px-4 py-3 font-medium">{row.code}</td>
                      <td className="px-4 py-3">v{row.version}</td>
                      <td className="px-4 py-3">{zh ? row.nameZh : row.nameEn}</td>
                      <td className="max-w-sm truncate px-4 py-3 font-mono text-xs">
                        {JSON.stringify(row.content)}
                      </td>
                      <td className="px-4 py-3">{row.status}</td>
                      <td className="px-4 py-3">
                        {canManage && row.status !== "RETIRED" ? (
                          <button
                            disabled={pending}
                            onClick={() =>
                              void request(`/api/templates/${row.id}`, "PATCH", {
                                status: row.status === "DRAFT" ? "PUBLISHED" : "RETIRED",
                              })
                            }
                            className="rounded-lg border px-3 py-1.5 disabled:opacity-60"
                          >
                            {row.status === "DRAFT"
                              ? zh
                                ? "发布"
                                : "Publish"
                              : zh
                                ? "停用"
                                : "Retire"}
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </>
  );
}
