"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
import type { StyleFormOptions } from "./style-options";

export function StyleCreateForm({
  locale,
  options,
}: {
  locale: Locale;
  options: StyleFormOptions;
}) {
  const zh = locale === "zh-CN";
  const router = useRouter();
  const requestLock = useRef(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requestLock.current) {
      return;
    }
    requestLock.current = true;
    setPending(true);
    setMessage("");
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    const canSample =
      (form.elements.namedItem("canSample") as HTMLInputElement | null)?.checked ?? false;
    const body = {
      ...Object.fromEntries(
        Object.entries(values).filter(([key, value]) => key !== "canSample" && value !== ""),
      ),
      canSample,
    };
    try {
      const response = await fetch("/api/styles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(
          result.error === "DUPLICATE_STYLE"
            ? zh
              ? "款号已存在。"
              : "That style code already exists."
            : zh
              ? "创建失败，请检查输入。"
              : "Unable to create the style. Check the input.",
        );
        return;
      }
      router.push(`/${locale}/workspace/style-design/styles/${result.style.id}`);
      router.refresh();
    } catch {
      setMessage(zh ? "网络错误，请重试。" : "Network error. Please try again.");
    } finally {
      requestLock.current = false;
      setPending(false);
    }
  }

  const inputClass = "rounded-lg border px-3 py-2";
  return (
    <section className="rounded-2xl border bg-white p-6">
      <form onSubmit={submit} className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-1 text-sm">
          {zh ? "款号" : "Style code"}
          <input name="code" required minLength={2} maxLength={30} className={inputClass} />
        </label>
        <label className="grid gap-1 text-sm">
          {zh ? "英文名称" : "English name"}
          <input name="nameEn" required minLength={2} maxLength={160} className={inputClass} />
        </label>
        <label className="grid gap-1 text-sm">
          {zh ? "中文名称" : "Chinese name"}
          <input name="nameZh" required minLength={1} maxLength={160} className={inputClass} />
        </label>
        <label className="grid gap-1 text-sm">
          {zh ? "类型" : "Style type"}
          <select name="styleTypeId" defaultValue="" className={inputClass}>
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
          {zh ? "季节" : "Season"}
          <select name="seasonId" defaultValue="" className={inputClass}>
            <option value="">{zh ? "未指定" : "None"}</option>
            {options.seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {zh ? season.nameZh : season.nameEn}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          {zh ? "年份" : "Year"}
          <select name="yearId" defaultValue="" className={inputClass}>
            <option value="">{zh ? "未指定" : "None"}</option>
            {options.years.map((year) => (
              <option key={year.id} value={year.id}>
                {zh ? year.nameZh : year.nameEn}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          {zh ? "波段" : "Stage"}
          <select name="stageId" defaultValue="" className={inputClass}>
            <option value="">{zh ? "未指定" : "None"}</option>
            {options.stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {zh ? stage.nameZh : stage.nameEn}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          {zh ? "客户" : "Customer"}
          <select name="customerId" defaultValue="" className={inputClass}>
            <option value="">{zh ? "未指定" : "None"}</option>
            {options.customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.code} · {customer.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          {zh ? "成品单位" : "Finished goods unit"}
          <select name="unitId" defaultValue="" className={inputClass}>
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
          {zh ? "设计号" : "Design number"}
          <input name="designNumber" maxLength={60} className={inputClass} />
        </label>
        <label className="grid gap-1 text-sm">
          {zh ? "纸样师" : "Pattern maker"}
          <input name="patternMakerName" maxLength={120} className={inputClass} />
        </label>
        <label className="grid gap-1 text-sm">
          {zh ? "品牌价" : "Brand price"}
          <input
            name="brandPrice"
            type="number"
            min={0}
            max={1_000_000}
            step="any"
            className={inputClass}
          />
        </label>
        <label className="grid gap-1 text-sm">
          {zh ? "工艺要求模板" : "Construction template"}
          <select name="constructionTemplateId" defaultValue="" className={inputClass}>
            <option value="">{zh ? "未指定" : "None"}</option>
            {options.constructionTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.code} · {zh ? template.nameZh : template.nameEn}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          {zh ? "尺寸表模板" : "Measurement template"}
          <select name="measurementTemplateId" defaultValue="" className={inputClass}>
            <option value="">{zh ? "未指定" : "None"}</option>
            {options.measurementTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.code} · {zh ? template.nameZh : template.nameEn}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 self-end text-sm">
          <input name="canSample" type="checkbox" className="size-4" />
          {zh ? "可打样" : "Can sample"}
        </label>
        <label className="grid gap-1 text-sm md:col-span-3">
          {zh ? "成分" : "Composition"}
          <input
            name="composition"
            maxLength={500}
            placeholder={zh ? "例如：95% 棉 5% 氨纶" : "e.g. 95% Cotton 5% Elastane"}
            className={inputClass}
          />
        </label>
        <label className="grid gap-1 text-sm md:col-span-3">
          {zh ? "备注" : "Notes"}
          <textarea name="notes" maxLength={2000} rows={2} className={inputClass} />
        </label>
        <button
          disabled={pending}
          aria-busy={pending}
          className="self-end rounded-lg bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (zh ? "创建中…" : "Creating…") : zh ? "创建款式" : "Create style"}
        </button>
        {message && (
          <p role="status" className="text-sm text-slate-600 md:col-span-3">
            {message}
          </p>
        )}
      </form>
    </section>
  );
}
