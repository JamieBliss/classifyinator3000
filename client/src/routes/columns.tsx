import { type ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  type SchemaFileRecordWithClassifications,
  type SchemaFileClassificationRead,
  FileStatus,
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
      const status = row.getValue('status') as FileStatus
      const classifications = row.getValue(
        'classifications',
      ) as SchemaFileClassificationRead[]

      if (status === FileStatus.Processing) {
        return <Skeleton className="h-[20px] w-[100px] rounded-full" />
      }

      if (classifications.length === 0) {
        return <div>-</div>
      }

      return <div>{classifications[0].classification}</div>
    },
  },
  {
    accessorKey: 'classifications',
    header: 'Classification Score',
    enableSorting: true,
    cell: ({ row }) => {
      const status = row.getValue('status') as FileStatus
      const classifications = row.getValue(
        'classifications',
      ) as SchemaFileClassificationRead[]

      if (status === FileStatus.Processing) {
        return <Skeleton className="h-[20px] w-[40px] rounded-full" />
      }

      if (classifications.length === 0) {
        return <div>-</div>
      }

      const classification_score = Math.round(
        classifications[0].classification_score * 100,
      )
      return <div>{classification_score}%</div>
    },
  },
]
