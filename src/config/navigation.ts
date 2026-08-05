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
    path: paths[id]?.[index],
  })),
});
const paths: Record<string, string[]> = {
  "master-data": [
    "master-data/customers",
    "master-data/factories",
    "master-data/suppliers",
    "master-data/delivery-addresses",
    "master-data/reference-data/settlement-methods",
    "master-data/reference-data/invoice-types",
    "master-data/reference-data/sample-types",
    "master-data/reference-data/expense-types",
    "master-data/reference-data/size-sort",
    "master-data/warehouses",
    "master-data/reference-data/sales-channels",
    "master-data/cashier-accounts",
    "master-data/templates/construction",
    "master-data/templates/measurement",
  ],
  "style-design": [
    "style-design/styles",
    "style-design/reference-data/style-types",
    "style-design/reference-data/seasons",
    "style-design/reference-data/years",
    "style-design/reference-data/stages",
    "style-design/finished-goods-units",
    "style-design/reference-data/processing-types",
    "style-design/reference-data/wash-types",
    "style-design/reference-data/fabric-trim-types",
    "style-design/reference-data/execution-standards",
    "style-design/templates/process",
  ],
  "material-development": ["material-development/material-units"],
};
export const navigation: NavigationItem[] = [
  m("dashboard", "工作台", "Dashboard"),
  m("master-data", "基础资料", "Master Data", [
    "客户 / Customers",
    "加工厂 / Factories",
    "供应商 / Suppliers",
    "送货地址 / Delivery Addresses",
    "结算方式 / Settlement Methods",
    "发票类型 / Invoice Types",
    "样板类型 / Sample Types",
    "费用类型 / Expense Types",
    "尺码排序 / Size Sorting",
    "仓库管理 / Warehouse Management",
    "销售渠道 / Sales Channels",
    "出纳账户 / Cashier Accounts",
    "工艺要求模板 / Construction Requirement Templates",
    "尺寸表模板 / Measurement Chart Templates",
  ]),
  m("planning", "商品企划", "Merchandise Planning", ["物料小样 / Material Swatch"]),
  m("style-design", "款式设计", "Style Design", [
    "款式档案 / Style Records",
    "款式类型 / Style Type",
    "季节 / Season",
    "年份 / Year",
    "波段 / Stage",
    "成品单位 / Finished Goods Units",
    "加工类型 / Processing Type",
    "洗水类型 / Wash Type",
    "面辅类型 / Fabric/Trim Type",
    "执行标准 / Execution Standard",
    "工序模板 / Process Template",
  ]),
  m("material-development", "物料开发", "Material Development", ["物料单位 / Material Units"]),
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
