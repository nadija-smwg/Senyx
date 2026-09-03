"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  isLoading?: boolean
  renderSubComponent?: (props: { row: any }) => React.ReactNode
  dateFilterColumn?: string
  /** Optional callback invoked by action cells to trigger a data refresh */
  onRefresh?: () => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  isLoading = false,
  renderSubComponent,
  dateFilterColumn,
  onRefresh,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>()

  const filteredData = React.useMemo(() => {
    if (!dateRange?.from || !dateFilterColumn) return data;
    return data.filter((item: any) => {
      const val = item[dateFilterColumn];
      if (!val) return false;
      const d = new Date(val);
      if (isNaN(d.getTime())) return false;
      
      const from = dateRange.from;
      if (!from) return true;
      const to = dateRange.to || from;
      
      const targetTime = new Date(d); targetTime.setHours(0,0,0,0);
      const fTime = new Date(from); fTime.setHours(0,0,0,0);
      const tTime = new Date(to); tTime.setHours(23,59,59,999);
      
      return targetTime.getTime() >= fTime.getTime() && targetTime.getTime() <= tTime.getTime();
    })
  }, [data, dateRange, dateFilterColumn]);

  const handleExport = () => {
    const rows = table.getFilteredRowModel().rows;
    if (!rows.length) return;
    const exportColumns = columns.filter(c => 'accessorKey' in c);
    const headers = exportColumns.map(c => (c as any).accessorKey);
    const headerRow = exportColumns.map(c => typeof c.header === 'string' ? c.header : (c as any).accessorKey).join(",");
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headerRow + "\n" 
      + rows.map(e => headers.map(h => `"${String(e.original[h as keyof TData] || '').replace(/"/g, '""')}"`).join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    getExpandedRowModel: getExpandedRowModel(),
    meta: { onRefresh },
  })

  return (
    <div className="w-full">
      {searchKey && (
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-100 bg-slate-50/30">
          <div className="flex items-center gap-3 w-full max-w-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 absolute ml-3"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
              className="pl-10 w-full bg-white border-slate-200 shadow-sm rounded-xl h-10 transition-shadow focus-visible:shadow-md"
            />
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Button onClick={handleExport} variant="outline" className="h-10 text-slate-600 rounded-xl bg-white shadow-sm font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              Export
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 text-slate-600 rounded-xl bg-white shadow-sm font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table.getAllColumns().filter(c => c.getCanHide()).map(c => {
                  return (
                    <DropdownMenuCheckboxItem key={c.id} className="capitalize" checked={c.getIsVisible()} onCheckedChange={v => c.toggleVisibility(!!v)}>
                      {typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {dateFilterColumn && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-10 text-slate-600 rounded-xl bg-white shadow-sm font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>{format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd")}</>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Date Range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                  {dateRange && (
                    <div className="p-3 border-t flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setDateRange(undefined)}>Clear</Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      )}
      <div className="w-full">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-auto max-h-[calc(100vh-250px)]">
          <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
              <React.Fragment key={row.id}>
                <TableRow
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
                {row.getIsExpanded() && renderSubComponent && (
                  <TableRow>
                    <TableCell colSpan={row.getVisibleCells().length}>
                      {renderSubComponent({ row })}
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center bg-slate-50/30">
                  <div className="flex flex-col items-center justify-center text-slate-500 space-y-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    <p className="text-sm font-medium">No records found matching your criteria.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden flex flex-col gap-4 p-4 bg-slate-50/50">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground border rounded-xl bg-card">Loading...</div>
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <div key={row.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3">
                {row.getVisibleCells().map((cell) => {
                  // Skip checkbox column for cards if it exists
                  if (cell.column.id === 'select' || cell.column.id === 'actions') {
                     return (
                       <div key={cell.id} className="flex justify-end border-t pt-3 mt-1">
                         {flexRender(cell.column.columnDef.cell, cell.getContext())}
                       </div>
                     )
                  }
                  
                  return (
                    <div key={cell.id} className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        {typeof cell.column.columnDef.header === 'string' ? cell.column.columnDef.header : cell.column.id}
                      </span>
                      <div className="text-sm text-slate-900 font-medium break-words">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="p-12 flex flex-col items-center justify-center text-slate-500 border rounded-xl bg-slate-50/50 space-y-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <span className="text-sm font-medium">No records found.</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between p-4 md:p-6 border-t border-slate-100 bg-slate-50/30">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
