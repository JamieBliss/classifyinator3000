import {
  FileStatus,
  type SchemaFileRecordWithClassifications,
} from '@/types/types'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { UploadCloud } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import { Button } from '../button'
import { FileInput } from '../file-input'

interface UploadFileProps {
  isDialogOpen: boolean
  setIsDialogOpen: Dispatch<SetStateAction<boolean>>
  data: SchemaFileRecordWithClassifications[]
  onFileUploadSuccess: (fileId: number) => void
}

export const UploadFile = ({
  isDialogOpen,
  setIsDialogOpen,
  data,
  onFileUploadSuccess,
}: UploadFileProps) => {
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild className="ml-2">
        <Button
          disabled={data
            .map((item) => item.status)
            .includes(FileStatus.Processing)}
        >
          Upload File
          <UploadCloud />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <VisuallyHidden asChild>
          <DialogTitle>Upload File</DialogTitle>
        </VisuallyHidden>
        <FileInput
          onFileUploadSuccess={onFileUploadSuccess}
          setIsDialogOpen={setIsDialogOpen}
        />
      </DialogContent>
    </Dialog>
  )
}
