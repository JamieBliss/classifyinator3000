import { Dialog, DialogClose, DialogDescription } from '@radix-ui/react-dialog'
import {
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { SchemaFileRecordWithClassifications } from '@/types/types'
import { useHandleFileError } from '@/hooks/use-handle-file-error'

interface ProcessingFileErrorDialogProps {
  data: SchemaFileRecordWithClassifications[]
  setData: (data: SchemaFileRecordWithClassifications[]) => void
  fileId: number | null
  setFileId: (fileId: number | null) => void
}

export const ProcessingFileErrorDialog = ({
  data,
  setData,
  fileId,
  setFileId,
}: ProcessingFileErrorDialogProps) => {
  const {
    deleteFile,
    errorFilename,
    isFileProcessingErrorDialogOpen,
    setIsFileProcessingErrorDialogOpen,
    setErrorFilename,
  } = useHandleFileError({
    data,
    setFileId,
    setData,
  })
  return (
    <Dialog
      open={isFileProcessingErrorDialogOpen}
      onOpenChange={setIsFileProcessingErrorDialogOpen}
    >
      <DialogContent>
        <DialogTitle>Error processing {errorFilename}</DialogTitle>
        <DialogDescription>
          There was an error processing the file, please ensure it isn't
          corrupted and is a valid, txt, pdf or docx. <br />
          <br /> You now have two options either leave the file which gives you
          the opportunity to delete at another time, or delete now.
        </DialogDescription>

        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="outline"
              onClick={() => {
                setErrorFilename(null)
                setFileId(null)
                setIsFileProcessingErrorDialogOpen(false)
              }}
            >
              Close
            </Button>
          </DialogClose>
          <Button
            type="submit"
            onClick={() => deleteFile(fileId!)}
            variant="destructive"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
