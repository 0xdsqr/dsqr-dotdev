"use client"

import { Button } from "@dsqr-dotdev/react/components/ui/button"
import { Input } from "@dsqr-dotdev/react/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@dsqr-dotdev/react/components/ui/table"
import { cn } from "@dsqr-dotdev/react/lib/utils"
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronLeft, ChevronRight } from "lucide-react"
import * as React from "react"

type DataTableProps<TData, TValue> = {
  columns: Array<ColumnDef<TData, TValue>>
  data: TData[]
  emptyMessage?: string
  searchColumn?: string
  searchPlaceholder?: string
  pageSize?: number
  className?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  emptyMessage = "No results found.",
  searchColumn,
  searchPlaceholder = "Search...",
  pageSize = 10,
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

  const table = useReactTable({
    data,
    columns,
    initialState: {
      pagination: {
        pageSize,
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const searchValue = searchColumn
    ? ((table.getColumn(searchColumn)?.getFilterValue() as string | undefined) ?? "")
    : ""

  return (
    <div className={cn("space-y-4", className)}>
      {searchColumn ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Input
            value={searchValue}
            onChange={(event) => table.getColumn(searchColumn)?.setFilterValue(event.target.value)}
            placeholder={searchPlaceholder}
            className="max-w-sm"
          />
          <p className="text-xs font-mono text-muted-foreground">
            {table.getFilteredRowModel().rows.length} rows
          </p>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-28 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-mono text-muted-foreground">
          page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <ChevronLeft className="size-4" />
            previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
