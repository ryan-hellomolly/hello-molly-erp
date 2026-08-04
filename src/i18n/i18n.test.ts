import { describe, expect, it } from "vitest";
import { formatCurrency, formatDateTime, formatMeasurement, formatNumber } from "./format";
import { translate, translateUnknown } from "./messages";
describe("internationalisation primitives", () => {
  it("translates and exposes missing keys safely", () => {
    expect(translate("zh-CN", "shell", "workspace")).toBe("工作台");
    expect(translate("en-AU", "masterData", "customers")).toBe("Customers");
    expect(translateUnknown("en-AU", "missing")).toBe("[missing]");
  });
  it("formats UTC instants by locale timezone", () => {
    expect(formatDateTime("2026-01-01T00:00:00Z", "en-AU")).toContain("2026");
    expect(formatDateTime("2026-01-01T00:00:00Z", "zh-CN")).toContain("2026");
  });
  it("formats numbers and currencies", () => {
    expect(formatNumber(1234.5, "en-AU")).toContain("1,234.5");
    expect(formatCurrency(25.5, "en-AU", "AUD")).toContain("25.50");
    expect(formatCurrency(25.5, "zh-CN", "CNY")).toContain("25.50");
  });
  it("formats measurements without changing stored precision", () => {
    expect(formatMeasurement(12.5, "en-AU", "centimeter")).toContain("12.5");
    expect(formatMeasurement(12.5, "zh-CN", "centimeter")).toContain("12.5");
  });
});
