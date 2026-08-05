"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
import type { StyleFormOptions } from "./style-options";

type Style = {
  id: string;
  code: string;
  nameEn: string;
  nameZh: string;
  styleTypeId: string | null;
  seasonId: string | null;
  yearId: string | null;
  stageId: string | null;
  designNumber: string | null;
  patternMakerName: string | null;
  composition: string | null;
  brandPrice: number | null;
  canSample: boolean;
  notes: string | null;
  customerId: string | null;
  unitId: string | null;
  constructionTemplateId: string | null;
  measurementTemplateId: string | null;
  status: "DRAFT" | "IN_DEVELOPMENT" | "SAMPLE_APPROVED" | "ACTIVE" | "DISCONTINUED";
};

const STATUSES = ["DRAFT", "IN_DEVELOPMENT", "SAMPLE_APPROVED", "ACTIVE", "DISCONTINUED"] as const;
const STATUS_LABEL: Record<(typeof STATUSES)[number], { en: string; zh: string }> = {
  DRAFT: { en: "Draft", zh: "草稿" },
  IN_DEVELOPMENT: { en: "In development", zh: "开发中" },
  SAMPLE_APPROVED: { en: "Sample approved", zh: "样品已核准" },
  ACTIVE: { en: "Active", zh: "启用" },
  DISCONTINUED: { en: "Discontinued", zh: "停用" },
};

export function StyleEditor({
  style,
  locale,
  options,
}: {
  style: Style;
  locale: Locale;
  options: StyleFormOptions;
}) {
  const zh = locale === "zh-CN";
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const requestLock = useRef(false);
  const statusRef = useRef<HTMLSelectElement>(null);

  async function patch(body: object) {
    if (requestLock.current) {
      return;
    }
    requestLock.current = true;
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(`/api/styles/${style.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(
          result.error === "INVALID_STYLE_TRANSITION"
            ? zh
              ? "不允许从当前状态直接切换到所选状态。"
              : "That status change isn't allowed from the current status."
            : zh
              ? "保存失败，请检查输入。"
              : "Unable to save. Check the input.",
        );
        return;
      }
      setMessage(zh ? "已保存。" : "Saved.");
      router.refresh();
    } catch {
      setMessage(zh ? "网络错误，请重试。" : "Network error. Please try again.");
    } finally {
      requestLock.current = false;
      setPending(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const raw = Object.fromEntries(new FormData(form));
    const canSample =
      (form.elements.namedItem("canSample") as HTMLInputElement | null)?.checked ?? false;
    const body = {
      ...Object.fromEntries(
        Object.entries(raw).filter(([key, value]) => key !== "canSample" && value !== ""),
      ),
      canSample,
    };
    await patch(body);
  }

  const inputClass = "rounded-lg border px-3 py-2";
  return (
    <section className="rounded-2xl border bg-white p-6">
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-1 text-sm">
          <span>{zh ? "款号（不可修改）" : "Style code (read only)"}</span>
          <input value={style.code} disabled className="rounded-lg border bg-slate-50 px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm">
          <span>{zh ? "英文名称" : "English name"}</span>
          <input
            name="nameEn"
            defaultValue={style.nameEn}
            required
            minLength={2}
            className={inputClass}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span>{zh ? "中文名称" : "Chinese name"}</span>
          <input
            name="nameZh"
            defaultValue={style.nameZh}
            required
            minLength={1}
            className={inputClass}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span>{zh ? "类型" : "Style type"}</span>
          <select name="styleTypeId" defaultValue={style.styleTypeId ?? ""} className={inputClass}>
            <option value="">{zh ? "未指定" : "None"}</option>
            {options.styleTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {"　".repeat(type.depth)}
                {zh ? type.nameZh : type.nameEn}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span>{zh ? "季节" : "Season"}</span>
          <select name="seasonId" defaultValue={style.seasonId ?? ""} className={inputClass}>
            <option value="">{zh ? "未指定" : "None"}</option>
            {options.seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {zh ? season.nameZh : season.nameEn}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span>{zh ? "年份" : "Year"}</span>
          <select name="yearId" defaultValue={style.yearId ?? ""} className={inputClass}>
            <option value="">{zh ? "未指定" : "None"}</option>
            {options.years.map((year) => (
              <option key={year.id} value={year.id}>
                {zh ? year.nameZh : year.nameEn}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span>{zh ? "波段" : "Stage"}</span>
          <select name="stageId" defaultValue={style.stageId ?? ""} className={inputClass}>
            <option value="">{zh ? "未指定" : "None"}</option>
            {options.stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {zh ? stage.nameZh : stage.nameEn}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span>{zh ? "客户" : "Customer"}</span>
          <select name="customerId" defaultValue={style.customerId ?? ""} className={inputClass}>
            <option value="">{zh ? "未指定" : "None"}</option>
            {options.customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.code} · {customer.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span>{zh ? "成品单位" : "Finished goods unit"}</span>
          <select name="unitId" defaultValue={style.unitId ?? ""} className={inputClass}>
            <option value="">{zh ? "未指定" : "None"}</option>
            {options.units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {zh ? unit.nameZh : unit.nameEn}
                {unit.symbol ? ` (${unit.symbol})` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span>{zh ? "设计号" : "Design number"}</span>
          <input
            name="designNumber"
            defaultValue={style.designNumber ?? ""}
            className={inputClass}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span>{zh ? "纸样师" : "Pattern maker"}</span>
          <input
            name="patternMakerName"
            defaultValue={style.patternMakerName ?? ""}
            className={inputClass}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span>{zh ? "品牌价" : "Brand price"}</span>
          <input
            name="brandPrice"
            type="number"
            min={0}
            max={1_000_000}
            step="any"
            defaultValue={style.brandPrice ?? ""}
            className={inputClass}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span>{zh ? "工艺要求模板" : "Construction template"}</span>
          <select
            name="constructionTemplateId"
            defaultValue={style.constructionTemplateId ?? ""}
            className={inputClass}
          >
            <option value="">{zh ? "未指定" : "None"}</option>
            {options.constructionTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.code} · {zh ? template.nameZh : template.nameEn}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span>{zh ? "尺寸表模板" : "Measurement template"}</span>
          <select
            name="measurementTemplateId"
            defaultValue={style.measurementTemplateId ?? ""}
            className={inputClass}
          >
            <option value="">{zh ? "未指定" : "None"}</option>
            {options.measurementTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.code} · {zh ? template.nameZh : template.nameEn}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 self-end text-sm">
          <input
            name="canSample"
            type="checkbox"
            defaultChecked={style.canSample}
            className="size-4"
          />
          {zh ? "可打样" : "Can sample"}
        </label>
        <label className="grid gap-1 text-sm md:col-span-3">
          <span>{zh ? "成分" : "Composition"}</span>
          <input name="composition" defaultValue={style.composition ?? ""} className={inputClass} />
        </label>
        <label className="grid gap-1 text-sm md:col-span-3">
          <span>{zh ? "备注" : "Notes"}</span>
          <textarea name="notes" defaultValue={style.notes ?? ""} rows={2} className={inputClass} />
        </label>
        <div className="flex items-end gap-3">
          <button
            disabled={pending}
            aria-busy={pending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? (zh ? "保存中…" : "Saving…") : zh ? "保存修改" : "Save changes"}
          </button>
        </div>
      </form>
      <div className="mt-6 flex flex-wrap items-end gap-3 border-t pt-4">
        <label className="grid gap-1 text-sm">
          <span>{zh ? "状态" : "Status"}</span>
          <select
            ref={statusRef}
            defaultValue={style.status}
            className="rounded-lg border px-3 py-2"
          >
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {zh ? STATUS_LABEL[value].zh : STATUS_LABEL[value].en}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (statusRef.current) {
              void patch({ status: statusRef.current.value });
            }
          }}
          className="rounded-lg border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {zh ? "更新状态" : "Update status"}
        </button>
      </div>
      {message && (
        <p role="status" className="mt-4 text-sm text-slate-600">
          {message}
        </p>
      )}
    </section>
  );
}
