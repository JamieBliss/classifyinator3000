import {
  FileStatus,
  type SchemaFileRecordWithClassifications,
} from '@/types/types'
import { Dialog, DialogContent, DialogTitle } from '../dialog'
import type { Dispatch, SetStateAction } from 'react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { ClassificationChart } from '../classifications-chart'
import { ProcessFileForm } from '../process-file-form'
import { Button } from '../button'

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
  const apiUrl = import.meta.env.VITE_API_URL

  const deleteFile = async (fileId: number) => {
    const res = await fetch(`${apiUrl}/files/delete/${fileId}`, {
      method: 'DELETE',
    })

    const json_response = await res.json()
    if (json_response.status !== 200) {
      setIsRowDetailsDialogOpen(false)
    }
  }
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
        <Button
          onClick={() => deleteFile(selectedRow?.id as number)}
          variant={'destructive'}
        >
          Delete File and Classifications
        </Button>
      </DialogContent>
    </Dialog>
  )
}
