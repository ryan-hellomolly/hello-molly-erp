import type { Locale } from "@/i18n/config";
export type NavigationItem = {
  id: string;
  label: { en: string; zh: string };
  permission?: string;
  children?: NavigationItem[];
  path?: string;
};
const m = (id: string, zh: string, en: string, children: string[] = []): NavigationItem => ({
  id,
  label: { zh, en },
  permission: `${id}.read`,
  children: children.map((name, index) => ({
    id: `${id}-${index + 1}`,
    label: { zh: name, en: name },
    path: id === "master-data" && index === 0 ? "master-data/customers" : undefined,
  })),
});
export const navigation: NavigationItem[] = [
  m("dashboard", "工作台", "Dashboard"),
  m("master-data", "基础资料", "Master Data", [
    "客户 / Customers",
    "加工厂 / Factories",
    "供应商 / Suppliers",
  ]),
  m("planning", "商品企划", "Merchandise Planning", [
    "企划看板 / Planning Board",
    "商品企划书 / Merchandise Plans",
    "新款开发计划 / Development Plans",
  ]),
  m("style-design", "款式设计", "Style Design"),
  m("material-development", "物料开发", "Material Development"),
  m("profiles", "画像构建", "Profile Builder"),
  m("sampling", "设计打样", "Design Sampling"),
  m("bulk-production", "大货管理", "Bulk Production"),
  m("material-procurement", "物料采购", "Material Procurement"),
  m("material-inventory", "物料进销存", "Material Inventory"),
  m("wip-inventory", "半成品进销存", "WIP Inventory"),
  m("finished-goods", "成品进销存", "Finished Goods"),
  m("finance", "财务管理", "Finance"),
  m("reports", "报表中心", "Reporting Centre"),
  m("system", "系统管理", "System Administration"),
];
export function labelFor(item: NavigationItem, locale: Locale) {
  return locale === "zh-CN" ? item.label.zh : item.label.en;
}
export function filterNavigation(
  items: NavigationItem[],
  roles: readonly string[],
): NavigationItem[] {
  if (roles.includes("SYSTEM_ADMIN")) {
    return items;
  }
  return items
    .filter((item) => !item.permission || roles.includes(item.permission))
    .map((item) => ({
      ...item,
      children: item.children ? filterNavigation(item.children, roles) : undefined,
    }));
}
