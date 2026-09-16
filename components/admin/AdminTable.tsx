"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/admin/Pagination";
import { Table } from "@/components/ui/table";

export const AdminTableSurface = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm",
      className,
    )}
    {...props}
  />
));
AdminTableSurface.displayName = "AdminTableSurface";

export function AdminTableViewport({
  children,
  tableClassName,
}: {
  children: React.ReactNode;
  tableClassName?: string;
}) {
  return (
    <Table className={cn("border-collapse text-left", tableClassName)}>{children}</Table>
  );
}

export interface AdminTableColumn<T> {
  id: string;
  header: React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  render?: (row: T) => React.ReactNode;
}

type AdminRenderedColumn<T> = AdminTableColumn<T> & {
  render: (row: T) => React.ReactNode;
};

type AdminDataTableProps<T> = {
  rows: readonly T[];
  rowKey: (row: T) => React.Key;
  tableClassName?: string;
  bodyClassName?: string;
} & (
  | {
      columns: readonly AdminRenderedColumn<T>[];
      renderRow?: never;
      rowClassName?: string | ((row: T) => string | undefined);
    }
  | {
      columns: readonly AdminTableColumn<T>[];
      /** Use for domain rows that own complex cross-cell behaviour. */
      renderRow: (row: T) => React.ReactNode;
      rowClassName?: never;
    }
);

export function AdminDataTable<T>(props: AdminDataTableProps<T>) {
  const { rows, rowKey, columns, renderRow, rowClassName, tableClassName, bodyClassName } = props;
  return (
    <AdminTableViewport tableClassName={tableClassName}>
      <thead>
        <tr className="border-b border-zinc-200 bg-white text-[11px] font-semibold uppercase tracking-wide text-[#763a12]">
          {columns.map((column) => (
            <th key={column.id} scope="col" className={column.headerClassName}>
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className={bodyClassName}>
        {rows.map((row) => {
          if (renderRow) {
            return <React.Fragment key={rowKey(row)}>{renderRow(row)}</React.Fragment>;
          }
          const resolvedRowClassName =
            typeof rowClassName === "function" ? rowClassName(row) : rowClassName;
          return (
            <tr key={rowKey(row)} className={resolvedRowClassName}>
              {columns.map((column) => (
                <td key={column.id} className={column.cellClassName}>
                  {column.render?.(row)}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </AdminTableViewport>
  );
}

type PageSizeOption = number | { value: number; label: string };

export function AdminTablePagination({
  page,
  pageSize,
  totalLoaded,
  serverHasMore = false,
  loading = false,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  pageSizeLabel = "Rows per page:",
  pageSizeAriaLabel = "Rows per page",
  summary,
  className,
}: {
  page: number;
  pageSize: number;
  totalLoaded: number;
  serverHasMore?: boolean;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: PageSizeOption[];
  pageSizeLabel?: string;
  pageSizeAriaLabel?: string;
  summary: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between gap-3 border-t border-zinc-200 bg-white px-4 py-3.5 sm:flex-row sm:px-6",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-xs text-zinc-600">
        <span className="font-medium text-zinc-500">{pageSizeLabel}</span>
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          aria-label={pageSizeAriaLabel}
          className="h-8 cursor-pointer rounded-xl border border-zinc-300 bg-white px-2.5 py-1 text-xs font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#763a12]/20"
        >
          {pageSizeOptions.map((option) => {
            const value = typeof option === "number" ? option : option.value;
            const label = typeof option === "number" ? `${option} rows` : option.label;
            return (
              <option key={value} value={value}>
                {label}
              </option>
            );
          })}
        </select>
        <span className="text-zinc-300">|</span>
        <span className="font-medium text-zinc-500">{summary}</span>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        totalLoaded={totalLoaded}
        serverHasMore={serverHasMore}
        loading={loading}
        className="border-t-0 p-0"
        onPageChange={onPageChange}
      />
    </div>
  );
}
