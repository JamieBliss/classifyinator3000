import { useState } from 'react'
import { Button } from './button'
import { ChevronsUpDown } from 'lucide-react'
import { Collapsible, CollapsibleContent } from './collapsible'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog'

interface DeleteFileProps {
  fileId: number | undefined
  setIsRowDetailsDialogOpen: (isOpen: boolean) => void
  deleteFile: (fileId: number) => void
}

export const DeleteFile = ({
  fileId,
  setIsRowDetailsDialogOpen,
  deleteFile,
}: DeleteFileProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const handleDeleteFile = () => {
    if (!fileId) return
    deleteFile(fileId)
    setIsOpen(false)
    setIsRowDetailsDialogOpen(false)
  }
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-medium">Danger Zone</h3>
          <p className="text-sm text-muted-foreground">
            Delete this file and all associated classifications
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronsUpDown />
          <span className="sr-only">Toggle</span>
        </Button>
      </div>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent className="mt-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant={'destructive'} disabled={!fileId}>
                Delete File and Classifications
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete the
                  file and all of its associated classification data.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleDeleteFile} variant={'destructive'}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
