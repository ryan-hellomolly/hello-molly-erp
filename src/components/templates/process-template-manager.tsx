"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { DeleteConfirmationDialog, TemplateActions } from "@/components/templates/template-actions";
import type { Locale } from "@/i18n/config";

type ProcessRow = {
  processName: string;
  processingTypeId?: string;
  workSeconds: number;
  unitPrice: number;
  tempUnitPrice: number;
  openPricing: boolean;
  isCountable: boolean;
  isKeyProcess: boolean;
};
type Row = {
  id: string;
  code: string;
  version: number;
  nameEn: string;
  nameZh: string;
  content: unknown;
};
type ProcessingType = { id: string; nameEn: string; nameZh: string };

const emptyRow = (): ProcessRow => ({
  processName: "",
  processingTypeId: undefined,
  workSeconds: 0,
  unitPrice: 0,
  tempUnitPrice: 0,
  openPricing: true,
  isCountable: true,
  isKeyProcess: true,
});

function rowsOf(content: unknown): ProcessRow[] {
  const value = content && typeof content === "object" ? content : {};
  return "rows" in value && Array.isArray(value.rows) ? (value.rows as ProcessRow[]) : [];
}

function ToggleSwitch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-blue-600" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block size-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export function ProcessTemplateManager({
  locale,
  rows,
  canManage,
  processingTypes,
}: {
  locale: Locale;
  rows: Row[];
  canManage: boolean;
  processingTypes: ProcessingType[];
}) {
  const zh = locale === "zh-CN";
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const lock = useRef(false);
  const [selectedId, setSelectedId] = useState(rows[0]?.id ?? "");
  const [editing, setEditing] = useState<Row | null>(null);
  const [session, setSession] = useState(0);
  const [tableRows, setTableRows] = useState<ProcessRow[]>([]);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [deleteCandidate, setDeleteCandidate] = useState<Row | null>(null);
  const selected = rows.find(({ id }) => id === selectedId) ?? rows[0];

  const processingTypeName = (id?: string) => {
    const type = processingTypes.find((x) => x.id === id);
    return type ? (zh ? type.nameZh : type.nameEn) : "—";
  };

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
    setEditing(row);
    setTableRows(row ? rowsOf(row.content) : [emptyRow()]);
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
  function updateRow<K extends keyof ProcessRow>(index: number, field: K, value: ProcessRow[K]) {
    setTableRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)),
    );
  }
  async function toggleField(
    index: number,
    field: "openPricing" | "isCountable" | "isKeyProcess",
    next: boolean,
  ) {
    if (!selected) {
      return;
    }
    const updatedRows = rowsOf(selected.content).map((row, rowIndex) =>
      rowIndex === index ? { ...row, [field]: next } : row,
    );
    await request(`/api/templates/${selected.id}`, "PATCH", {
      name: zh ? selected.nameZh : selected.nameEn,
      rows: updatedRows,
    });
  }
  function moveRow(index: number, direction: -1 | 1) {
    setTableRows((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) {
        return current;
      }
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = String(new FormData(form).get("name") ?? "").trim();
    if (!name) {
      setMessage(zh ? "请输入模板名称。" : "Enter a template name.");
      return;
    }
    if (editing) {
      await request(`/api/templates/${editing.id}`, "PATCH", { name, rows: tableRows });
    } else {
      await request("/api/templates", "POST", {
        type: "PROCESS",
        code: `PROCESS-${crypto.randomUUID().slice(0, 8)}`.toUpperCase(),
        version: 1,
        nameEn: name,
        nameZh: name,
        content: { rows: tableRows },
      });
    }
  }

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
                ＋ {zh ? "添加模版" : "Add template"}
              </button>
            ) : null}
          </div>
          <div className="max-h-[570px] overflow-y-auto">
            {rows.map((row) => (
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
            ))}
          </div>
        </aside>
        <article className="min-w-0 overflow-x-auto p-6 lg:p-8">
          {selected ? (
            <>
              <h2 className="mb-5 border-b pb-4 text-xl font-semibold">
                {zh ? selected.nameZh : selected.nameEn}
              </h2>
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead>
                  <tr>
                    {[
                      zh ? "序号" : "#",
                      zh ? "工序名称" : "Process name",
                      zh ? "环节" : "Stage",
                      zh ? "工时（秒）" : "Work time (s)",
                      zh ? "单价" : "Unit price",
                      zh ? "临时工价" : "Temp price",
                      zh ? "开放单价" : "Open pricing",
                      zh ? "是否计数" : "Countable",
                      zh ? "关键工序" : "Key process",
                    ].map((x) => (
                      <th key={x} className="border bg-slate-50 p-2">
                        {x}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rowsOf(selected.content).map((row, index) => (
                    <tr key={index}>
                      <td className="border p-2 text-center">{index + 1}</td>
                      <td className="border p-2">{row.processName}</td>
                      <td className="border p-2">{processingTypeName(row.processingTypeId)}</td>
                      <td className="border p-2 text-right">{row.workSeconds}</td>
                      <td className="border p-2 text-right">{row.unitPrice}</td>
                      <td className="border p-2 text-right">{row.tempUnitPrice}</td>
                      {(["openPricing", "isCountable", "isKeyProcess"] as const).map((field) => (
                        <td key={field} className="border p-2 text-center">
                          {canManage ? (
                            <ToggleSwitch
                              checked={row[field]}
                              disabled={pending}
                              label={
                                field === "openPricing"
                                  ? zh
                                    ? "开放单价"
                                    : "Open pricing"
                                  : field === "isCountable"
                                    ? zh
                                      ? "是否计数"
                                      : "Countable"
                                    : zh
                                      ? "关键工序"
                                      : "Key process"
                              }
                              onChange={(next) => void toggleField(index, field, next)}
                            />
                          ) : row[field] ? (
                            "✓"
                          ) : (
                            "—"
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {message ? (
                <p role="status" className="mt-3 text-sm text-slate-600">
                  {message}
                </p>
              ) : null}
            </>
          ) : (
            <div className="flex min-h-96 items-center justify-center text-slate-400">
              {zh ? "请从左侧选择模板" : "Select a template from the left"}
            </div>
          )}
        </article>
      </section>
      <dialog
        ref={dialog}
        className="m-auto w-[min(1200px,calc(100%-2rem))] rounded-xl border p-0 shadow-2xl backdrop:bg-black/40"
      >
        <form key={session} onSubmit={submit} className="p-5">
          <div className="mb-5 flex justify-between border-b pb-4">
            <h2 className="text-xl font-semibold">
              {editing
                ? zh
                  ? "编辑工序模板"
                  : "Edit process template"
                : zh
                  ? "新增工序模板"
                  : "New process template"}
            </h2>
            <button type="button" onClick={() => dialog.current?.close()} className="text-2xl">
              ×
            </button>
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-sm">
              <thead>
                <tr>
                  {[
                    "#",
                    zh ? "工序名称" : "Process name",
                    zh ? "环节" : "Stage",
                    zh ? "工时（秒）" : "Work time (s)",
                    zh ? "单价" : "Unit price",
                    zh ? "临时工价" : "Temp price",
                    zh ? "开放单价" : "Open pricing",
                    zh ? "是否计数" : "Countable",
                    zh ? "关键工序" : "Key process",
                    zh ? "操作" : "Actions",
                  ].map((x) => (
                    <th key={x} className="border bg-slate-50 p-2">
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, index) => (
                  <tr key={index}>
                    <td className="border p-2 text-center">{index + 1}</td>
                    <td className="border p-1">
                      <input
                        value={row.processName}
                        onChange={(event) => updateRow(index, "processName", event.target.value)}
                        className="w-full min-w-32 px-2 py-1 outline-none"
                      />
                    </td>
                    <td className="border p-1">
                      <select
                        value={row.processingTypeId ?? ""}
                        onChange={(event) =>
                          updateRow(index, "processingTypeId", event.target.value || undefined)
                        }
                        className="w-full min-w-28 px-2 py-1 outline-none"
                      >
                        <option value="">{zh ? "未指定" : "None"}</option>
                        {processingTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {zh ? type.nameZh : type.nameEn}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border p-1">
                      <input
                        type="number"
                        min={0}
                        step="1"
                        value={row.workSeconds}
                        onChange={(event) =>
                          updateRow(index, "workSeconds", Number(event.target.value))
                        }
                        className="w-full min-w-20 px-2 py-1 outline-none"
                      />
                    </td>
                    <td className="border p-1">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={row.unitPrice}
                        onChange={(event) =>
                          updateRow(index, "unitPrice", Number(event.target.value))
                        }
                        className="w-full min-w-20 px-2 py-1 outline-none"
                      />
                    </td>
                    <td className="border p-1">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={row.tempUnitPrice}
                        onChange={(event) =>
                          updateRow(index, "tempUnitPrice", Number(event.target.value))
                        }
                        className="w-full min-w-20 px-2 py-1 outline-none"
                      />
                    </td>
                    {(["openPricing", "isCountable", "isKeyProcess"] as const).map((field) => (
                      <td key={field} className="border p-2 text-center">
                        <ToggleSwitch
                          checked={row[field]}
                          onChange={(next) => updateRow(index, field, next)}
                        />
                      </td>
                    ))}
                    <td className="border p-2">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveRow(index, -1)}
                          className="disabled:opacity-30"
                          aria-label={zh ? "上移" : "Move up"}
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={index === tableRows.length - 1}
                          onClick={() => moveRow(index, 1)}
                          className="disabled:opacity-30"
                          aria-label={zh ? "下移" : "Move down"}
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setTableRows((current) =>
                              current.filter((_, rowIndex) => rowIndex !== index),
                            )
                          }
                          className="text-red-500"
                        >
                          {zh ? "删除" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              onClick={() => setTableRows((current) => [...current, emptyRow()])}
              className="mt-3 w-full rounded border border-dashed border-blue-400 py-2 text-blue-600"
            >
              ＋ {zh ? "添加一行" : "Add row"}
            </button>
          </div>
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
