"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { RichTextEditor } from "@/components/templates/construction-template-manager";
import { DeleteConfirmationDialog, TemplateActions } from "@/components/templates/template-actions";
import type { Locale } from "@/i18n/config";

type Kind = "BASIC" | "SIZE_TABLE";
type MeasurementRow = {
  name: string;
  method: string;
  tolerance: string;
  gradeRule: string;
  patternSize: string;
  patternValue: string;
  notes: string;
};
type Row = {
  id: string;
  code: string;
  version: number;
  nameEn: string;
  nameZh: string;
  content: unknown;
};
const emptyRow = (): MeasurementRow => ({
  name: "",
  method: "",
  tolerance: "",
  gradeRule: "",
  patternSize: "",
  patternValue: "",
  notes: "",
});
function contentOf(content: unknown) {
  const value = content && typeof content === "object" ? content : {};
  const kind = "kind" in value && value.kind === "SIZE_TABLE" ? "SIZE_TABLE" : "BASIC";
  const html = "html" in value && typeof value.html === "string" ? value.html : "";
  const rows = "rows" in value && Array.isArray(value.rows) ? (value.rows as MeasurementRow[]) : [];
  return { kind: kind as Kind, html, rows };
}

export function MeasurementTemplateManager({
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
  const dialog = useRef<HTMLDialogElement>(null);
  const lock = useRef(false);
  const [selectedId, setSelectedId] = useState(rows[0]?.id ?? "");
  const [editing, setEditing] = useState<Row | null>(null);
  const [session, setSession] = useState(0);
  const [kind, setKind] = useState<Kind>("BASIC");
  const [tableRows, setTableRows] = useState<MeasurementRow[]>([]);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [deleteCandidate, setDeleteCandidate] = useState<Row | null>(null);
  const selected = rows.find(({ id }) => id === selectedId) ?? rows[0];

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
        headers: { "content-type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const result = await response.json();
      setMessage(
        response.ok
          ? zh
            ? "已保存。"
            : "Saved."
          : (result.error ?? (zh ? "操作失败。" : "Operation failed.")),
      );
      if (response.ok) {
        dialog.current?.close();
        router.refresh();
      }
      return response.ok;
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  function open(row: Row | null) {
    const content = row ? contentOf(row.content) : { kind: "BASIC" as const, html: "", rows: [] };
    setEditing(row);
    setKind(content.kind);
    setTableRows(content.rows);
    setSession((value) => value + 1);
    setMessage("");
    dialog.current?.showModal();
  }
  async function remove(row: Row) {
    if (await request(`/api/templates/${row.id}`, "DELETE")) {
      setSelectedId(rows.find(({ id }) => id !== row.id)?.id ?? "");
      setDeleteCandidate(null);
    }
  }
  function updateRow(index: number, field: keyof MeasurementRow, value: string) {
    setTableRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)),
    );
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = String(new FormData(form).get("name") ?? "").trim();
    const html = form.querySelector<HTMLElement>("[contenteditable=true]")?.innerHTML.trim() ?? "";
    if (!name || (kind === "BASIC" && (!html || html === "<br>"))) {
      setMessage(zh ? "请输入模板名称和内容。" : "Enter a template name and content.");
      return;
    }
    const payload = kind === "BASIC" ? { name, kind, html } : { name, kind, rows: tableRows };
    if (editing) {
      await request(`/api/templates/${editing.id}`, "PATCH", payload);
    } else {
      const content = kind === "BASIC" ? { kind, format: "html", html } : { kind, rows: tableRows };
      await request("/api/templates", "POST", {
        type: "MEASUREMENT",
        code: `MEASURE-${Date.now().toString(36).toUpperCase()}`,
        version: 1,
        nameEn: name,
        nameZh: name,
        content,
      });
    }
  }
  const labels: Array<[keyof MeasurementRow, string, string]> = [
    ["name", "名称", "Name"],
    ["method", "测量方法", "Method"],
    ["tolerance", "允许公差", "Tolerance"],
    ["gradeRule", "档差", "Grade rule"],
    ["patternSize", "纸样尺码", "Pattern size"],
    ["patternValue", "纸样值", "Pattern value"],
    ["notes", "备注", "Notes"],
  ];
  return (
    <>
      <section className="grid min-h-[620px] overflow-hidden rounded-2xl border bg-white lg:grid-cols-[350px_minmax(0,1fr)]">
        <aside className="border-b lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="font-semibold">{zh ? "模板名称" : "Template name"}</h2>
            {canManage ? (
              <button
                onClick={() => open(null)}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white"
              >
                ＋ {zh ? "添加模板" : "Add template"}
              </button>
            ) : null}
          </div>
          <div className="max-h-[570px] overflow-y-auto">
            {rows.map((row) => {
              const type = contentOf(row.content).kind;
              return (
                <div
                  key={row.id}
                  className={`flex items-center gap-2 border-b px-4 py-3 ${selected?.id === row.id ? "bg-blue-50" : "hover:bg-slate-50"}`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(row.id)}
                    className="min-w-0 flex-1 truncate text-left font-medium"
                  >
                    {zh ? row.nameZh : row.nameEn}
                  </button>
                  <span
                    className={`rounded border px-1.5 py-0.5 text-xs ${type === "BASIC" ? "border-green-300 text-green-600" : "border-blue-300 text-blue-600"}`}
                  >
                    {type === "BASIC" ? (zh ? "基础" : "Basic") : zh ? "尺寸" : "Size"}
                  </span>
                  {canManage ? (
                    <TemplateActions
                      editLabel={zh ? `编辑${row.nameZh}` : `Edit ${row.nameEn}`}
                      deleteLabel={zh ? `删除${row.nameZh}` : `Delete ${row.nameEn}`}
                      disabled={pending}
                      onEdit={() => open(row)}
                      onDelete={() => setDeleteCandidate(row)}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </aside>
        <article className="min-w-0 p-6 lg:p-8">
          {selected ? (
            <MeasurementPreview row={selected} zh={zh} />
          ) : (
            <div className="flex min-h-96 items-center justify-center text-slate-400">
              {zh ? "请从左侧选择模板" : "Select a template from the left"}
            </div>
          )}
        </article>
      </section>
      <dialog
        ref={dialog}
        className="m-auto w-[min(1100px,calc(100%-2rem))] rounded-xl border p-0 shadow-2xl backdrop:bg-black/40"
      >
        <form key={session} onSubmit={submit} className="p-5">
          <div className="mb-5 flex justify-between border-b pb-4">
            <h2 className="text-xl font-semibold">
              {editing ? (zh ? "编辑模板" : "Edit template") : zh ? "新建模板" : "New template"}
            </h2>
            <button type="button" onClick={() => dialog.current?.close()} className="text-2xl">
              ×
            </button>
          </div>
          <div className="mb-4 flex gap-6">
            <span>
              <span className="text-red-500">* </span>
              {zh ? "模板类型" : "Template type"}
            </span>
            {(["SIZE_TABLE", "BASIC"] as const).map((value) => (
              <label key={value} className="flex gap-2">
                <input
                  type="radio"
                  checked={kind === value}
                  onChange={() => {
                    setKind(value);
                    if (value === "SIZE_TABLE" && !tableRows.length) {
                      setTableRows([emptyRow()]);
                    }
                  }}
                />
                {value === "BASIC"
                  ? zh
                    ? "基础模板"
                    : "Basic template"
                  : zh
                    ? "尺寸模板"
                    : "Size template"}
              </label>
            ))}
          </div>
          <label className="mb-5 flex items-center gap-3">
            <span>
              <span className="text-red-500">* </span>
              {zh ? "模板名称" : "Template name"}
            </span>
            <input
              name="name"
              required
              defaultValue={editing ? (zh ? editing.nameZh : editing.nameEn) : ""}
              className="min-w-0 flex-1 rounded-lg border px-3 py-2"
            />
          </label>
          {kind === "BASIC" ? (
            <RichTextEditor
              initialHtml={editing ? contentOf(editing.content).html : ""}
              zh={zh}
              onMessage={setMessage}
            />
          ) : (
            <MeasurementTableEditor
              rows={tableRows}
              labels={labels}
              zh={zh}
              updateRow={updateRow}
              setRows={setTableRows}
            />
          )}
          {message ? (
            <p className="mt-3 text-sm text-red-600" role="status">
              {message}
            </p>
          ) : null}
          <div className="mt-5 flex justify-end gap-2 border-t pt-4">
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="rounded-lg border px-4 py-2"
            >
              {zh ? "取消" : "Cancel"}
            </button>
            <button
              disabled={pending}
              className="rounded-lg bg-blue-600 px-5 py-2 text-white disabled:opacity-50"
            >
              {pending ? (zh ? "保存中…" : "Saving…") : zh ? "保存" : "Save"}
            </button>
          </div>
        </form>
      </dialog>
      <DeleteConfirmationDialog
        name={deleteCandidate ? (zh ? deleteCandidate.nameZh : deleteCandidate.nameEn) : null}
        zh={zh}
        pending={pending}
        onCancel={() => setDeleteCandidate(null)}
        onConfirm={() => {
          if (deleteCandidate) {
            void remove(deleteCandidate);
          }
        }}
      />
    </>
  );
}

function MeasurementPreview({ row, zh }: { row: Row; zh: boolean }) {
  const content = contentOf(row.content);
  return (
    <>
      <h2 className="mb-5 border-b pb-4 text-xl font-semibold">{zh ? row.nameZh : row.nameEn}</h2>
      {content.kind === "BASIC" ? (
        <div
          className="leading-7 [&_img]:max-w-full [&_table]:w-full"
          dangerouslySetInnerHTML={{ __html: content.html }}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["名称", "测量方法", "允许公差", "档差", "纸样尺码", "纸样值", "备注"].map((x) => (
                  <th key={x} className="border bg-slate-50 p-2">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {content.rows.map((item, index) => (
                <tr key={index}>
                  {Object.values(item).map((value, cell) => (
                    <td key={cell} className="border p-2">
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function MeasurementTableEditor({
  rows,
  labels,
  zh,
  updateRow,
  setRows,
}: {
  rows: MeasurementRow[];
  labels: Array<[keyof MeasurementRow, string, string]>;
  zh: boolean;
  updateRow: (index: number, field: keyof MeasurementRow, value: string) => void;
  setRows: React.Dispatch<React.SetStateAction<MeasurementRow[]>>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1050px] w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border bg-slate-50 p-2">#</th>
            {labels.map(([field, cn, en]) => (
              <th key={field} className="border bg-slate-50 p-2">
                {zh ? cn : en}
              </th>
            ))}
            <th className="border bg-slate-50 p-2">{zh ? "操作" : "Action"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td className="border p-2 text-center">{index + 1}</td>
              {labels.map(([field]) => (
                <td key={field} className="border p-1">
                  <input
                    value={row[field]}
                    onChange={(event) => updateRow(index, field, event.target.value)}
                    className="w-full min-w-28 px-2 py-1 outline-none"
                  />
                </td>
              ))}
              <td className="border p-2">
                <button
                  type="button"
                  onClick={() =>
                    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))
                  }
                  className="text-red-500"
                >
                  {zh ? "删除" : "Delete"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={() => setRows((current) => [...current, emptyRow()])}
        className="mt-3 w-full rounded border border-dashed border-blue-400 py-2 text-blue-600"
      >
        ＋ {zh ? "添加一行" : "Add row"}
      </button>
    </div>
  );
}
