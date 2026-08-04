"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { DeleteConfirmationDialog, TemplateActions } from "@/components/templates/template-actions";
import type { Locale } from "@/i18n/config";

type Address = { id: string; address: string; sortOrder: number };
type Account = {
  id: string;
  name: string;
  routingNumber: string | null;
  accountNumber: string;
  currency: string;
  address: string | null;
  notes: string | null;
  qrCodeUrl: string | null;
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
            className="mb-5 grid gap-3 md:grid-cols-[100px_1fr_auto]"
          >
            <input
              name="sortOrder"
              type="number"
              min="0"
              defaultValue={editing?.sortOrder ?? 0}
              className="rounded-lg border px-3 py-2"
            />
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
              <th className="p-3">{zh ? "序号" : "Order"}</th>
              <th className="p-3">{zh ? "地址" : "Address"}</th>
              <th className="p-3">{zh ? "操作" : "Actions"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-3">{row.sortOrder}</td>
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
  const [editing, setEditing] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState<Account | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (
      await request(
        editing ? `/api/cashier-accounts/${editing.id}` : "/api/cashier-accounts",
        editing ? "PATCH" : "POST",
        Object.fromEntries(new FormData(form)),
      )
    ) {
      form.reset();
      setEditing(null);
    }
  }
  const input = "rounded-lg border px-3 py-2";
  return (
    <>
      <section className="rounded-2xl border bg-white p-5">
        {canManage ? (
          <details open={Boolean(editing)} className="mb-5">
            <summary className="cursor-pointer font-semibold">
              ＋ {editing ? (zh ? "编辑账户" : "Edit account") : zh ? "添加账户" : "Add account"}
            </summary>
            <form
              key={editing?.id ?? "new"}
              onSubmit={submit}
              className="mt-4 grid gap-3 md:grid-cols-3"
            >
              <input
                name="name"
                required
                defaultValue={editing?.name ?? ""}
                placeholder={zh ? "名称" : "Name"}
                className={input}
              />
              <input
                name="routingNumber"
                defaultValue={editing?.routingNumber ?? ""}
                placeholder={zh ? "行号" : "Routing number"}
                className={input}
              />
              <input
                name="accountNumber"
                required
                defaultValue={editing?.accountNumber ?? ""}
                placeholder={zh ? "号码" : "Account number"}
                className={input}
              />
              <input
                name="currency"
                required
                maxLength={3}
                defaultValue={editing?.currency ?? "AUD"}
                placeholder={zh ? "币种" : "Currency"}
                className={input}
              />
              <input
                name="address"
                defaultValue={editing?.address ?? ""}
                placeholder={zh ? "地址" : "Address"}
                className={input}
              />
              <input
                name="qrCodeUrl"
                defaultValue={editing?.qrCodeUrl ?? ""}
                placeholder={zh ? "收款码图片地址" : "QR image URL"}
                className={input}
              />
              <input
                name="notes"
                defaultValue={editing?.notes ?? ""}
                placeholder={zh ? "备注" : "Notes"}
                className={`${input} md:col-span-2`}
              />
              <button disabled={pending} className="rounded-lg bg-blue-600 px-4 py-2 text-white">
                {zh ? "保存" : "Save"}
              </button>
            </form>
          </details>
        ) : null}
        <div className="overflow-x-auto">
          <table className="min-w-[950px] w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                {[
                  zh ? "收款码" : "QR",
                  zh ? "名称" : "Name",
                  zh ? "行号" : "Routing",
                  zh ? "号码" : "Account",
                  zh ? "币种" : "Currency",
                  zh ? "地址" : "Address",
                  zh ? "备注" : "Notes",
                  zh ? "操作" : "Actions",
                ].map((x) => (
                  <th key={x} className="p-3">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="p-3">
                    {row.qrCodeUrl ? (
                      <Image
                        src={row.qrCodeUrl}
                        alt="QR"
                        width={40}
                        height={40}
                        unoptimized
                        className="size-10 object-contain"
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3 font-medium">{row.name}</td>
                  <td className="p-3">{row.routingNumber ?? "—"}</td>
                  <td className="p-3">{row.accountNumber}</td>
                  <td className="p-3">{row.currency}</td>
                  <td className="p-3">{row.address ?? "—"}</td>
                  <td className="p-3">{row.notes ?? "—"}</td>
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
