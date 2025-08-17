import {
  FileStatus,
  type SchemaFileRecordWithClassifications,
} from '@/types/types'
import { Dialog, DialogContent, DialogTitle } from '../dialog'
import type { Dispatch, SetStateAction } from 'react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { ClassificationChart } from '../classifications-chart'
import { ProcessFileForm } from '../process-file-form'

interface RowDialogProps {
  selectedRow: SchemaFileRecordWithClassifications | undefined
  isRowDetailsDialogOpen: boolean
  setIsRowDetailsDialogOpen: Dispatch<SetStateAction<boolean>>
  onFileUploadSuccess: (fileId: number) => void
}
export const RowDialog = ({
  selectedRow,
  isRowDetailsDialogOpen,
  setIsRowDetailsDialogOpen,
  onFileUploadSuccess,
}: RowDialogProps) => {
  return (
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
            {selectedRow.status !== FileStatus.Failed ? (
              <ClassificationChart row={selectedRow} />
            ) : (
              <></>
            )}
            <ProcessFileForm
              rowId={selectedRow.id}
              onFileProcessStart={onFileUploadSuccess}
              closeDialog={() => setIsRowDetailsDialogOpen(false)}
              defaultIsOpen={selectedRow.status === FileStatus.Failed}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
