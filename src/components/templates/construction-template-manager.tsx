"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { DeleteConfirmationDialog, TemplateActions } from "@/components/templates/template-actions";
import type { Locale } from "@/i18n/config";

type Row = {
  id: string;
  code: string;
  version: number;
  nameEn: string;
  nameZh: string;
  content: unknown;
  status: "DRAFT" | "PUBLISHED" | "RETIRED";
};

function htmlFrom(content: unknown) {
  if (
    content &&
    typeof content === "object" &&
    "html" in content &&
    typeof content.html === "string"
  ) {
    return content.html;
  }
  return "";
}

export function RichTextEditor({
  initialHtml = "",
  zh,
  onMessage,
}: {
  initialHtml?: string;
  zh: boolean;
  onMessage: (message: string) => void;
}) {
  const editor = useRef<HTMLDivElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const wordInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const run = (command: string, value?: string) => {
    editor.current?.focus();
    document.execCommand(command, false, value);
  };
  const insertHtml = (html: string) => run("insertHTML", html);
  const insertTable = () => {
    const rows = Number(window.prompt(zh ? "表格行数" : "Number of rows", "3"));
    const columns = Number(window.prompt(zh ? "表格列数" : "Number of columns", "3"));
    if (!Number.isInteger(rows) || !Number.isInteger(columns) || rows < 1 || columns < 1) {
      return;
    }
    const cells = Array.from(
      { length: Math.min(rows, 20) },
      () =>
        `<tr>${Array.from({ length: Math.min(columns, 10) }, () => "<td><br></td>").join("")}</tr>`,
    ).join("");
    insertHtml(
      `<table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse"><tbody>${cells}</tbody></table><p><br></p>`,
    );
  };
  const insertLink = () => {
    const url = window.prompt(zh ? "请输入链接地址" : "Enter link URL", "https://");
    if (url && /^https?:\/\//i.test(url)) {
      run("createLink", url);
    }
  };
  async function upload(file: File) {
    setUploading(true);
    onMessage(zh ? "正在上传并处理…" : "Uploading and processing…");
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/template-assets", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) {
        onMessage(result.error ?? (zh ? "上传失败。" : "Upload failed."));
        return;
      }
      insertHtml(
        result.type === "image"
          ? `<img src="${result.url}" alt="${file.name}" style="max-width:100%;height:auto"><p><br></p>`
          : result.html,
      );
      onMessage(zh ? "文件已插入。" : "File inserted.");
    } catch {
      onMessage(zh ? "文件上传失败。" : "File upload failed.");
    } finally {
      setUploading(false);
    }
  }
  const openDocument = (print: boolean) => {
    const popup = window.open("", "_blank");
    if (!popup) {
      onMessage(zh ? "浏览器阻止了预览窗口。" : "The browser blocked the preview window.");
      return;
    }
    popup.opener = null;
    popup.document.write(
      `<!doctype html><html><head><title>${zh ? "工艺要求预览" : "Construction requirements preview"}</title><style>body{font-family:Arial,'Microsoft YaHei',sans-serif;max-width:900px;margin:40px auto;padding:0 24px;line-height:1.6}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:6px}img{max-width:100%;height:auto}</style></head><body>${editor.current?.innerHTML ?? ""}</body></html>`,
    );
    popup.document.close();
    if (print) {
      popup.addEventListener("load", () => popup.print(), { once: true });
    }
  };
  const button = "min-w-9 border-r px-2 py-2 text-sm hover:bg-slate-100 disabled:opacity-50";
  return (
    <div
      className={`${fullscreen ? "fixed inset-0 z-50 flex flex-col rounded-none" : "rounded-lg md:col-span-4"} overflow-hidden border bg-white`}
    >
      <div
        className="flex flex-wrap border-b bg-slate-50"
        role="toolbar"
        aria-label="Rich text formatting"
      >
        <button type="button" className={button} onClick={() => run("undo")} aria-label="Undo">
          ↶
        </button>
        <button type="button" className={button} onClick={() => run("redo")} aria-label="Redo">
          ↷
        </button>
        <select
          aria-label="Font"
          className="border-r bg-transparent px-2 py-2 text-sm"
          defaultValue="Microsoft YaHei"
          onChange={(event) => run("fontName", event.target.value)}
        >
          <option value="Microsoft YaHei">微软雅黑</option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
        </select>
        <select
          aria-label="Font size"
          className="border-r bg-transparent px-2 py-2 text-sm"
          defaultValue="3"
          onChange={(event) => run("fontSize", event.target.value)}
        >
          <option value="2">12pt</option>
          <option value="3">14pt</option>
          <option value="4">18pt</option>
          <option value="5">24pt</option>
        </select>
        <label className={`${button} cursor-pointer`} title="Text colour">
          A
          <input
            type="color"
            className="sr-only"
            onChange={(event) => run("foreColor", event.target.value)}
          />
        </label>
        <label className={`${button} cursor-pointer`} title="Highlight colour">
          ▰
          <input
            type="color"
            className="sr-only"
            onChange={(event) => run("hiliteColor", event.target.value)}
          />
        </label>
        <button
          type="button"
          className={button}
          onClick={() => run("justifyLeft")}
          aria-label="Align left"
        >
          ≡
        </button>
        <button
          type="button"
          className={button}
          onClick={() => run("justifyCenter")}
          aria-label="Align centre"
        >
          ≣
        </button>
        <button
          type="button"
          className={button}
          onClick={() => run("justifyRight")}
          aria-label="Align right"
        >
          ≡
        </button>
        <button
          type="button"
          className={`${button} font-bold`}
          onClick={() => run("bold")}
          aria-label="Bold"
        >
          B
        </button>
        <button
          type="button"
          className={`${button} italic`}
          onClick={() => run("italic")}
          aria-label="Italic"
        >
          I
        </button>
        <button
          type="button"
          className={`${button} underline`}
          onClick={() => run("underline")}
          aria-label="Underline"
        >
          U
        </button>
        <button
          type="button"
          className={button}
          onClick={() => run("insertUnorderedList")}
          aria-label="Bullet list"
        >
          •
        </button>
        <button
          type="button"
          className={button}
          onClick={() => run("insertOrderedList")}
          aria-label="Numbered list"
        >
          1.
        </button>
        <button type="button" className={button} onClick={insertTable} aria-label="Insert table">
          ▦
        </button>
        <button
          type="button"
          className={button}
          onClick={() => imageInput.current?.click()}
          disabled={uploading}
          aria-label="Insert image"
        >
          ▧
        </button>
        <button type="button" className={button} onClick={insertLink} aria-label="Insert link">
          🔗
        </button>
        <button
          type="button"
          className={button}
          onClick={() => openDocument(false)}
          aria-label="Preview"
        >
          ◉
        </button>
        <button
          type="button"
          className={button}
          onClick={() => openDocument(true)}
          aria-label="Print"
        >
          ▣
        </button>
        <button
          type="button"
          className={button}
          onClick={() => setFullscreen((value) => !value)}
          aria-label="Fullscreen"
        >
          {fullscreen ? "↙" : "⛶"}
        </button>
        <button
          type="button"
          className={`${button} whitespace-nowrap`}
          onClick={() => wordInput.current?.click()}
          disabled={uploading}
          aria-label="Upload Word"
        >
          ▤ {zh ? "上传Word" : "Upload Word"}
        </button>
        <button
          type="button"
          className={button}
          onClick={() => run("removeFormat")}
          aria-label="Clear formatting"
        >
          Tx
        </button>
      </div>
      <div
        ref={editor}
        contentEditable
        suppressContentEditableWarning
        data-placeholder="请输入 / Enter content"
        className={`${fullscreen ? "flex-1" : "min-h-80"} overflow-auto p-4 text-base outline-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)] [&_img]:max-w-full [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2`}
        dangerouslySetInnerHTML={{ __html: initialHtml }}
      />
      <input
        ref={imageInput}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void upload(file);
          }
          event.target.value = "";
        }}
      />
      <input
        ref={wordInput}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void upload(file);
          }
          event.target.value = "";
        }}
      />
      <div className="border-t px-3 py-1 text-xs text-slate-500">
        {uploading ? (zh ? "正在处理文件…" : "Processing file…") : "P"}
      </div>
    </div>
  );
}

export function ConstructionTemplateManager({
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
  const dialog = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [editorSession, setEditorSession] = useState(0);
  const [selectedId, setSelectedId] = useState(rows[0]?.id ?? "");
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
          : (result.error ?? (zh ? "保存失败。" : "Unable to save.")),
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
    setEditorSession((value) => value + 1);
    setMessage("");
    dialog.current?.showModal();
  }

  async function remove(row: Row) {
    if (await request(`/api/templates/${row.id}`, "DELETE")) {
      setSelectedId(rows.find(({ id }) => id !== row.id)?.id ?? "");
      setDeleteCandidate(null);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = String(new FormData(form).get("name") ?? "").trim();
    const html = form.querySelector<HTMLElement>("[contenteditable=true]")?.innerHTML.trim() ?? "";
    if (!name || !html || html === "<br>") {
      setMessage(zh ? "请输入名称和内容。" : "Enter a name and content.");
      return;
    }
    if (editing) {
      await request(`/api/templates/${editing.id}`, "PATCH", { name, html });
      return;
    }
    const code = `CON-${Date.now().toString(36).toUpperCase()}`;
    await request("/api/templates", "POST", {
      type: "CONSTRUCTION",
      code,
      version: 1,
      nameEn: name,
      nameZh: name,
      content: { format: "html", html },
    });
  }

  return (
    <>
      <section className="grid min-h-[620px] overflow-hidden rounded-2xl border bg-white lg:grid-cols-[350px_minmax(0,1fr)]">
        <aside className="border-b lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3 border-b p-4">
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
            {rows.length ? (
              rows.map((row) => {
                const active = row.id === selected?.id;
                return (
                  <div
                    key={row.id}
                    className={`flex items-center gap-2 border-b px-4 py-3 ${active ? "bg-blue-50" : "hover:bg-slate-50"}`}
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 truncate text-left font-medium"
                      onClick={() => setSelectedId(row.id)}
                      aria-current={active ? "true" : undefined}
                    >
                      {zh ? row.nameZh : row.nameEn}
                    </button>
                    <span className="text-xs text-slate-400">v{row.version}</span>
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
              })
            ) : (
              <p className="p-6 text-sm text-slate-500">
                {zh ? "尚未创建工艺要求模板。" : "No construction templates yet."}
              </p>
            )}
          </div>
        </aside>
        <article className="min-w-0 p-6 lg:p-8">
          {selected ? (
            <>
              <div className="mb-5 flex flex-wrap items-center gap-3 border-b pb-4">
                <h2 className="text-xl font-semibold">
                  {zh ? selected.nameZh : selected.nameEn} -{" "}
                  {zh ? "工艺要求" : "Construction requirements"}
                </h2>
                <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs text-green-700">
                  v{selected.version} · {zh ? "可用" : "Available"}
                </span>
              </div>
              <div
                className="prose max-w-none leading-7 text-slate-700 [&_img]:max-w-full [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2"
                dangerouslySetInnerHTML={{ __html: htmlFrom(selected.content) }}
              />
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
        className="m-auto w-[min(900px,calc(100%-2rem))] rounded-xl border p-0 shadow-2xl backdrop:bg-black/40"
      >
        <form key={editorSession} onSubmit={submit} className="p-5">
          <div className="mb-5 flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-semibold">
              {editing ? (zh ? "编辑模板" : "Edit template") : zh ? "新建模板" : "New template"}
            </h2>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label="Close"
              className="text-2xl text-slate-500"
            >
              ×
            </button>
          </div>
          <label className="mb-4 flex items-center gap-3">
            <span className="w-20 text-right">
              <span className="text-red-500">* </span>
              {zh ? "名称" : "Name"}
            </span>
            <input
              name="name"
              required
              defaultValue={editing ? (zh ? editing.nameZh : editing.nameEn) : ""}
              className="w-80 rounded-lg border px-3 py-2"
              placeholder={zh ? "请输入名称" : "Enter a name"}
            />
          </label>
          <RichTextEditor
            key={editorSession}
            initialHtml={editing ? htmlFrom(editing.content) : ""}
            zh={zh}
            onMessage={setMessage}
          />
          {message ? (
            <p role="status" className="mt-3 text-sm text-red-600">
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
              aria-busy={pending}
              className="rounded-lg bg-blue-600 px-5 py-2 text-white disabled:opacity-60"
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
