"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { DeleteConfirmationDialog, TemplateActions } from "@/components/templates/template-actions";
import type { Locale } from "@/i18n/config";

type Address = { id: string; address: string };
type Account = {
  id: string;
  name: string;
};
function useMutation(locale: Locale) {
  const router = useRouter();
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function request(path: string, method: string, body?: object) {
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
        response.ok ? (locale === "zh-CN" ? "已保存。" : "Saved.") : (result.error ?? "Error"),
      );
      if (response.ok) {
        router.refresh();
      }
      return response.ok;
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  return { pending, message, request };
}
export function DeliveryAddressManager({
  locale,
  rows,
  canManage,
}: {
  locale: Locale;
  rows: Address[];
  canManage: boolean;
}) {
  const zh = locale === "zh-CN";
  const { pending, message, request } = useMutation(locale);
  const [editing, setEditing] = useState<Address | null>(null);
  const [deleting, setDeleting] = useState<Address | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    if (
      await request(
        editing ? `/api/delivery-addresses/${editing.id}` : "/api/delivery-addresses",
        editing ? "PATCH" : "POST",
        body,
      )
    ) {
      form.reset();
      setEditing(null);
    }
  }
  return (
    <>
      <section className="rounded-2xl border bg-white p-5">
        {canManage ? (
          <form
            key={editing?.id ?? "new"}
            onSubmit={submit}
            className="mb-5 grid gap-3 md:grid-cols-[1fr_auto]"
          >
            <input
              name="address"
              required
              defaultValue={editing?.address ?? ""}
              placeholder={zh ? "请输入送货地址" : "Enter delivery address"}
              className="rounded-lg border px-3 py-2"
            />
            <button disabled={pending} className="rounded-lg bg-blue-600 px-4 py-2 text-white">
              {editing ? (zh ? "更新" : "Update") : zh ? "添加" : "Add"}
            </button>
          </form>
        ) : null}
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3">{zh ? "地址" : "Address"}</th>
              <th className="p-3">{zh ? "操作" : "Actions"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-3">{row.address}</td>
                <td className="p-3">
                  {canManage ? (
                    <TemplateActions
                      editLabel={zh ? "编辑" : "Edit"}
                      deleteLabel={zh ? "删除" : "Delete"}
                      disabled={pending}
                      onEdit={() => setEditing(row)}
                      onDelete={() => setDeleting(row)}
                    />
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {message ? <p className="mt-3 text-sm">{message}</p> : null}
      </section>
      <DeleteConfirmationDialog
        name={deleting?.address ?? null}
        zh={zh}
        pending={pending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            void request(`/api/delivery-addresses/${deleting.id}`, "DELETE").then((ok) => {
              if (ok) {
                setDeleting(null);
              }
            });
          }
        }}
      />
    </>
  );
}
export function CashierAccountManager({
  locale,
  rows,
  canManage,
}: {
  locale: Locale;
  rows: Account[];
  canManage: boolean;
}) {
  const zh = locale === "zh-CN";
  const { pending, message, request } = useMutation(locale);
  const [deleting, setDeleting] = useState<Account | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = String(new FormData(form).get("name") ?? "").trim();
    if (!name) {
      return;
    }
    if (
      await request("/api/cashier-accounts", "POST", {
        name,
        accountNumber: `INTERNAL-${crypto.randomUUID()}`,
        currency: "AUD",
      })
    ) {
      form.reset();
    }
  }
  return (
    <>
      <section className="rounded-2xl border bg-white p-5">
        {canManage ? (
          <form onSubmit={submit} className="mb-5 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              name="name"
              required
              maxLength={160}
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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3">{zh ? "名称" : "Name"}</th>
                {canManage ? <th className="w-24 p-3">{zh ? "操作" : "Actions"}</th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="p-3 font-medium">{row.name}</td>
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
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 2 : 1} className="p-8 text-center text-slate-400">
                    {zh ? "暂无数据" : "No records yet"}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {message ? <p className="mt-3 text-sm">{message}</p> : null}
      </section>
      <DeleteConfirmationDialog
        name={deleting?.name ?? null}
        zh={zh}
        pending={pending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            void request(`/api/cashier-accounts/${deleting.id}`, "DELETE").then((ok) => {
              if (ok) {
                setDeleting(null);
              }
            });
          }
        }}
      />
    </>
  );
}
