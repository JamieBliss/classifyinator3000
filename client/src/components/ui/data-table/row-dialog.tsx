import {
  FileStatus,
  type SchemaFileRecordWithClassifications,
} from '@/types/types'
import { Dialog, DialogContent, DialogTitle } from '../dialog'
import type { Dispatch, SetStateAction } from 'react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { ClassificationChart } from '../classification-charts/classification-charts'
import { ProcessFileForm } from '../process-file-form'
import { useClassificationData } from '@/hooks/use-classification-data'
import { ClassificationDetails } from '../classification-details'
import { DeleteFile } from '../delete-file'

interface RowDialogProps {
  selectedRow: SchemaFileRecordWithClassifications | undefined
  isRowDetailsDialogOpen: boolean
  setIsRowDetailsDialogOpen: Dispatch<SetStateAction<boolean>>
  onFileUploadSuccess: (fileId: number) => void
  deleteFile: (fileId: number) => void
}
export const RowDialog = ({
  selectedRow,
  isRowDetailsDialogOpen,
  setIsRowDetailsDialogOpen,
  onFileUploadSuccess,
  deleteFile,
}: RowDialogProps) => {
  const classificationData = useClassificationData(selectedRow)
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
              <>
                <ClassificationChart
                  row={selectedRow}
                  {...classificationData}
                />
                <ClassificationDetails {...classificationData} />
              </>
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
        <DeleteFile
          fileId={selectedRow?.id}
          setIsRowDetailsDialogOpen={setIsRowDetailsDialogOpen}
          deleteFile={deleteFile}
        />
      </DialogContent>
    </Dialog>
  )
}
