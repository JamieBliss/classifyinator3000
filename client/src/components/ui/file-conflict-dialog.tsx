import { Button } from './button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog'

interface FileConflictDialogProps {
  filename: string
  isFileConflictDialogOpen: boolean
  setIsFileConflictDialogOpen: (isOpen: boolean) => void
  handleFileConflict: (override: boolean) => void
}

export const FileConflictDialog = ({
  filename,
  isFileConflictDialogOpen,
  setIsFileConflictDialogOpen,
  handleFileConflict,
}: FileConflictDialogProps) => {
  return (
    <Dialog
      open={isFileConflictDialogOpen}
      onOpenChange={setIsFileConflictDialogOpen}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Error - Filename '{filename}' already exists
          </DialogTitle>
          <DialogDescription>
            You can either cancel this upload request or override the existing
            file. This will also <b>wipe classification data</b> and re-run file
            processing
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={() => handleFileConflict(false)}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            onClick={() => handleFileConflict(true)}
            variant="destructive"
          >
            Override
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
