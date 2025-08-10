import { type ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type {
  SchemaFileRecordWithClassifications,
  SchemaFileClassificationRead,
} from '@/types/types'
import { StatusDot } from './status-dot'

export const columns: ColumnDef<SchemaFileRecordWithClassifications>[] = [
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusDot fileStatus={row.getValue('status')} />,
  },
  {
    accessorKey: 'filename',
    enableSorting: true,
    enableColumnFilter: true,
    cell: ({ row }) => <div>{row.getValue('filename')}</div>,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Filename
          <ArrowUpDown />
        </Button>
      )
    },
  },
  {
    accessorKey: 'classifications',
    id: 'classification_name',
    header: 'Classification',
    cell: ({ row }) => {
      const classifications = row.getValue(
        'classifications',
      ) as SchemaFileClassificationRead[]
      return (
        <div>
          {classifications.length > 0 ? classifications[0].classification : ''}
        </div>
      )
    },
  },
  {
    accessorKey: 'classifications',
    header: 'Classification Score',
    enableSorting: true,
    cell: ({ row }) => {
      const classifications = row.getValue(
        'classifications',
      ) as SchemaFileClassificationRead[]
      return (
        <div>
          {classifications.length > 0
            ? `${Math.round(classifications[0].classification_score * 100)}%`
            : ''}
        </div>
      )
    },
  },
]
