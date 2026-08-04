"use client";
import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
export function DataTable<T>({
  data,
  columns,
  labels,
}: {
  data: T[];
  columns: ColumnDef<T>[];
  labels: { search: string; columns: string; previous: string; next: string; empty: string };
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filter, setFilter] = useState("");
  // TanStack Table intentionally exposes mutable callbacks; React Compiler must not memoize this hook.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter: filter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });
  return (
    <div className="rounded-2xl border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <input
          aria-label={labels.search}
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder={labels.search}
          className="w-72 rounded-lg border px-3 py-2 text-sm"
        />
        <details className="relative">
          <summary className="cursor-pointer rounded-lg border px-3 py-2 text-sm">
            {labels.columns}
          </summary>
          <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border bg-white p-2 shadow-xl">
            {table.getAllLeafColumns().map((column) => (
              <label key={column.id} className="flex gap-2 p-2 text-sm">
                <input
                  type="checkbox"
                  checked={column.getIsVisible()}
                  onChange={column.getToggleVisibilityHandler()}
                />
                {column.id}
              </label>
            ))}
          </div>
        </details>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th key={header.id} className="whitespace-nowrap px-4 py-3">
                    <button
                      onClick={header.column.getToggleSortingHandler()}
                      className="font-semibold"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === "asc"
                        ? " ↑"
                        : header.column.getIsSorted() === "desc"
                          ? " ↓"
                          : ""}
                    </button>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t hover:bg-slate-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="whitespace-nowrap px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {table.getRowModel().rows.length === 0 && (
          <p className="p-10 text-center text-sm text-slate-500">{labels.empty}</p>
        )}
      </div>
      <div className="flex items-center justify-end gap-3 border-t p-4">
        <span className="text-sm text-slate-500">
          {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
        </span>
        <button
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
          className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
        >
          {labels.previous}
        </button>
        <button
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
          className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
        >
          {labels.next}
        </button>
      </div>
    </div>
  );
}
