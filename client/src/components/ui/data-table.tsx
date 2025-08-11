import { useState } from 'react'
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table'
import { ChevronDown, UploadCloud } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FileStatus,
  type SchemaFileRecordWithClassifications,
} from '@/types/types'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FileInput } from '@/components/ui/file-input'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { ClassificationChart } from '@/components/ui/classifications-chart'
import { ProcessFileForm } from './process-file-form'

interface DataTableProps {
  data: SchemaFileRecordWithClassifications[]
  columns: ColumnDef<SchemaFileRecordWithClassifications>[]
  onFileUploadSuccess: (fileId: number) => void
}

export function DataTable({
  data,
  columns,
  onFileUploadSuccess,
}: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isRowDetailsDialogOpen, setIsRowDetailsDialogOpen] = useState(false)
  const [selectedRow, setSelectedRow] =
    useState<SchemaFileRecordWithClassifications>()

  const table = useReactTable({
    data,
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
  })

  return (
    <div className="w-3/4">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter files..."
          value={
            (table.getColumn('filename')?.getFilterValue() as string) ?? ''
          }
          onChange={(event) =>
            table.getColumn('filename')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild className="ml-2">
              <Button
                disabled={data
                  .map((item) => item.status)
                  .includes(FileStatus.Processing)}
              >
                Upload File
                <UploadCloud />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <VisuallyHidden asChild>
                <DialogTitle>Upload File</DialogTitle>
              </VisuallyHidden>
              <FileInput
                onFileUploadSuccess={onFileUploadSuccess}
                setIsDialogOpen={setIsDialogOpen}
              />
            </DialogContent>
          </Dialog>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="overflow-hidden rounded-md border">
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
                            header.getContext(),
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={() => {
                    if (row.original.status === FileStatus.Processing) return
                    setIsRowDetailsDialogOpen(true)
                    setSelectedRow(row.original)
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
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
      <Dialog
        open={isRowDetailsDialogOpen}
        onOpenChange={setIsRowDetailsDialogOpen}
      >
        <DialogContent className="!max-w-[700px]">
          <VisuallyHidden asChild>
            <DialogTitle>Row Details</DialogTitle>
          </VisuallyHidden>
          {selectedRow && (
            <>
              <ClassificationChart row={selectedRow} />
              <ProcessFileForm
                row={selectedRow}
                onFileProcessStart={onFileUploadSuccess}
                closeDialog={() => setIsRowDetailsDialogOpen(false)}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
