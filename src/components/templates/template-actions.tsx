"use client";

export function TemplateActions({
  editLabel,
  deleteLabel,
  disabled,
  onEdit,
  onDelete,
}: {
  editLabel: string;
  deleteLabel: string;
  disabled?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const button = "rounded p-1.5 transition hover:bg-slate-100 disabled:opacity-40";
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        title={editLabel}
        aria-label={editLabel}
        onClick={onEdit}
        className={`${button} text-blue-600`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
        </svg>
      </button>
      <button
        type="button"
        title={deleteLabel}
        aria-label={deleteLabel}
        disabled={disabled}
        onClick={onDelete}
        className={`${button} text-red-500`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="m19 6-1 14H6L5 6" />
          <path d="M10 11v5M14 11v5" />
        </svg>
      </button>
    </div>
  );
}

export function DeleteConfirmationDialog({
  name,
  zh,
  pending,
  onCancel,
  onConfirm,
}: {
  name: string | null;
  zh: boolean;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!name) {
    return null;
  }
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-template-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-red-50 text-red-600">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 9v4M12 17h.01" />
            <path d="M10.3 3.7 2.5 17.2A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.8L13.7 3.7a2 2 0 0 0-3.4 0Z" />
          </svg>
        </div>
        <h2 id="delete-template-title" className="text-lg font-semibold">
          {zh ? "确认删除模板" : "Delete template?"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {zh ? (
            <>
              确定永久删除“<strong>{name}</strong>”吗？删除后无法恢复。
            </>
          ) : (
            <>
              Permanently delete “<strong>{name}</strong>”? This action cannot be undone.
            </>
          )}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="rounded-lg border px-4 py-2 disabled:opacity-50"
          >
            {zh ? "取消" : "Cancel"}
          </button>
          <button
            type="button"
            disabled={pending}
            aria-busy={pending}
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {pending ? (zh ? "删除中…" : "Deleting…") : zh ? "确认删除" : "Delete"}
          </button>
        </div>
      </section>
    </div>
  );
}
