"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/data-table";
import type { Locale } from "@/i18n/config";

export type StyleRow = {
  id: string;
  code: string;
  nameEn: string;
  nameZh: string;
  styleType: { nameEn: string; nameZh: string } | null;
  season: { nameEn: string; nameZh: string } | null;
  status: "DRAFT" | "IN_DEVELOPMENT" | "SAMPLE_APPROVED" | "ACTIVE" | "DISCONTINUED";
  customer: { code: string; name: string } | null;
  _count: { colorways: number };
};

const STATUS_LABEL: Record<StyleRow["status"], { en: string; zh: string }> = {
  DRAFT: { en: "Draft", zh: "草稿" },
  IN_DEVELOPMENT: { en: "In development", zh: "开发中" },
  SAMPLE_APPROVED: { en: "Sample approved", zh: "样品已核准" },
  ACTIVE: { en: "Active", zh: "启用" },
  DISCONTINUED: { en: "Discontinued", zh: "停用" },
};

export function StyleTable({ data, locale }: { data: StyleRow[]; locale: Locale }) {
  const zh = locale === "zh-CN";
  const columns: ColumnDef<StyleRow>[] = [
    { accessorKey: "code", header: zh ? "款号" : "Style code" },
    {
      id: "name",
      header: zh ? "款式名称" : "Style name",
      accessorFn: (row) => (zh ? row.nameZh : row.nameEn),
    },
    {
      id: "styleType",
      header: zh ? "类型" : "Style type",
      accessorFn: (row) => (zh ? row.styleType?.nameZh : row.styleType?.nameEn) ?? "",
    },
    {
      id: "season",
      header: zh ? "季节" : "Season",
      accessorFn: (row) => (zh ? row.season?.nameZh : row.season?.nameEn) ?? "",
    },
    {
      id: "customer",
      header: zh ? "客户" : "Customer",
      accessorFn: (row) => row.customer?.name ?? "",
    },
    {
      id: "colorways",
      header: zh ? "色号数" : "Colorways",
      accessorFn: (row) => row._count.colorways,
    },
    {
      accessorKey: "status",
      header: zh ? "状态" : "Status",
      cell: ({ row }) =>
        zh ? STATUS_LABEL[row.original.status].zh : STATUS_LABEL[row.original.status].en,
    },
    {
      id: "actions",
      header: zh ? "操作" : "Actions",
      enableSorting: false,
      cell: ({ row }) => (
        <Link
          href={`/${locale}/workspace/style-design/styles/${row.original.id}`}
          className="font-medium text-blue-600 hover:underline"
        >
          {zh ? "编辑 / 审计" : "Edit / Audit"}
        </Link>
      ),
    },
  ];
  return (
    <DataTable
      data={data}
      columns={columns}
      labels={{
        search: zh ? "筛选当前页" : "Filter current page",
        columns: zh ? "显示列" : "Columns",
        previous: zh ? "上一页" : "Previous",
        next: zh ? "下一页" : "Next",
        empty: zh ? "没有匹配的款式" : "No matching styles",
      }}
    />
  );
}
