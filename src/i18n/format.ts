import type { Locale } from "./config";
export const localeTimeZone: Record<Locale, string> = {
  "en-AU": "Australia/Sydney",
  "zh-CN": "Asia/Shanghai",
};
export function formatDateTime(
  value: Date | string,
  locale: Locale,
  timeZone = localeTimeZone[locale],
) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}
export function formatNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
}
export function formatCurrency(value: number, locale: Locale, currency: "AUD" | "CNY" = "AUD") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).format(value);
}
export type MeasurementUnit = "centimeter" | "inch" | "kilogram";
export function formatMeasurement(value: number, locale: Locale, unit: MeasurementUnit) {
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit,
    unitDisplay: "short",
    maximumFractionDigits: 2,
  }).format(value);
}
