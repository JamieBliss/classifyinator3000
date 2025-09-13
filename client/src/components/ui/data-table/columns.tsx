import { type ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  type SchemaFileRecordWithClassifications,
  FileStatus,
  type SchemaFileClassificationWithScoresAndChunks,
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
    accessorKey: 'model',
    header: 'Model',
    cell: ({ row }) => {
      const status = row.getValue('status') as FileStatus

      if (status === FileStatus.Processing) {
        return <Skeleton className="h-[20px] w-[150px] rounded-full" />
      }

      const classifications = row.getValue(
        'classifications',
      ) as SchemaFileClassificationWithScoresAndChunks[]

      if (classifications.length === 0) {
        return <div>-</div>
      }

      const classification = classifications[0]
      return <div>{classification.model}</div>
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
      ) as SchemaFileClassificationWithScoresAndChunks[]

      if (status === FileStatus.Processing) {
        return <Skeleton className="h-[20px] w-[100px] rounded-full" />
      }

      if (classifications.length === 0) {
        return <div>-</div>
      }

      return (
        <div>
          {classifications[0].file_classification_scores[0].classification}
        </div>
      )
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
      ) as SchemaFileClassificationWithScoresAndChunks[]

      if (status === FileStatus.Processing) {
        return <Skeleton className="h-[20px] w-[40px] rounded-full" />
      }

      if (classifications.length === 0) {
        return <div>-</div>
      }

      const classification =
        classifications[0].file_classification_scores[0].classification_score
      const classification_score = Math.round(classification * 100)
      // Colour confidence scores based on value - numbers might need adjusting
      let colourClass = ''
      if (classification_score < 20) {
        colourClass = 'text-red-600'
      } else if (classification_score < 40) {
        colourClass = 'text-orange-500'
      } else if (classification_score < 60) {
        colourClass = 'text-yellow-500'
      } else if (classification_score < 80) {
        colourClass = 'text-lime-500'
      } else {
        colourClass = 'text-green-600'
      }
      return (
        <div className={`font-medium ${colourClass}`}>
          {classification_score}%
        </div>
      )
    },
  },
]
