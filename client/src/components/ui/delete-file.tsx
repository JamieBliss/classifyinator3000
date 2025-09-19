import { useState } from 'react'
import { Button } from './button'
import { ChevronsUpDown } from 'lucide-react'
import { Collapsible, CollapsibleContent } from './collapsible'

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

  const handleDeleteFile = async (fileId: number) => {
    deleteFile(fileId)
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
        <CollapsibleContent>
          <Button
            onClick={() => handleDeleteFile(fileId as number)}
            variant={'destructive'}
          >
            Delete File and Classifications
          </Button>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
