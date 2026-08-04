"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/data-table";
import type { Locale } from "@/i18n/config";

export type CustomerRow = {
  id: string;
  code: string;
  name: string;
  countryCode: string;
  salesChannel: string | null;
  ownerName: string | null;
  status: "ACTIVE" | "INACTIVE";
};

export function CustomerTable({ data, locale }: { data: CustomerRow[]; locale: Locale }) {
  const zh = locale === "zh-CN";
  const columns: ColumnDef<CustomerRow>[] = [
    { accessorKey: "code", header: zh ? "客户编码" : "Customer code" },
    { accessorKey: "name", header: zh ? "客户名称" : "Customer name" },
    { accessorKey: "countryCode", header: zh ? "国家/地区" : "Country" },
    { accessorKey: "salesChannel", header: zh ? "销售渠道" : "Sales channel" },
    { accessorKey: "ownerName", header: zh ? "负责人" : "Owner" },
    {
      accessorKey: "status",
      header: zh ? "状态" : "Status",
      cell: ({ row }) => (row.original.status === "ACTIVE" ? (zh ? "启用" : "Active") : zh ? "停用" : "Inactive"),
    },
    {
      id: "actions",
      header: zh ? "操作" : "Actions",
      enableSorting: false,
      cell: ({ row }) => (
        <Link
          href={`/${locale}/workspace/master-data/customers/${row.original.id}`}
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
        empty: zh ? "没有匹配的客户" : "No matching customers",
      }}
    />
  );
}
