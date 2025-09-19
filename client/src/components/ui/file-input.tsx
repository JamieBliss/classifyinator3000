import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Loader2Icon,
  UploadCloud,
  File as FileIcon,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { FileConflictDialog } from './file-conflict-dialog'
import { useFileUpload } from '@/hooks/use-file-upload'

interface FileInputProps {
  onFileUploadSuccess: (fileId: number) => void
  setIsDialogOpen: (isOpen: boolean) => void
}

export function FileInput({
  onFileUploadSuccess,
  setIsDialogOpen,
}: FileInputProps) {
  const {
    selectedFile,
    isLoading,
    uploadStatus,
    message,
    isFileConflictDialogOpen,
    handleCancel,
    handleFileChange,
    handleUpload,
    handleFileConflict,
    setIsFileConflictDialogOpen,
  } = useFileUpload({
    onFileUploadSuccess,
    setIsDialogOpen,
  })

  return (
    <div className="grid w-full max-w-lg items-center gap-4">
      <Label htmlFor="file-upload" className="text-center font-semibold">
        Upload Documents
      </Label>

      <div className="relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/80 transition-colors">
        <UploadCloud className="w-10 h-10 text-muted-foreground mt-2" />
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="font-semibold text-primary">Click to upload</span> or
          drag and drop
        </p>
        <Input
          id="file-upload"
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
          accept=".txt,.docx,.pdf"
          disabled={isLoading}
        />
      </div>

      {selectedFile && (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-3 max-w-70">
            <FileIcon className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium truncate mr-2 w-full">
              {selectedFile.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleUpload(false)}
              disabled={isLoading}
              size="sm"
            >
              {isLoading && (
                <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
              )}
              {isLoading ? 'Uploading...' : 'Upload'}
            </Button>
            <Button
              onClick={handleCancel}
              disabled={isLoading}
              size="sm"
              variant="destructive"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {uploadStatus === 'success' && message && (
        <div className="flex items-center gap-2 p-3 text-sm text-green-700 bg-green-100 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5" />
          <span>{message}</span>
        </div>
      )}
      {uploadStatus === 'error' && message && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-lg">
          <XCircle className="w-5 h-5" />
          <span>{message}</span>
        </div>
      )}
      <FileConflictDialog
        filename={selectedFile?.name ?? ''}
        isFileConflictDialogOpen={isFileConflictDialogOpen}
        setIsFileConflictDialogOpen={setIsFileConflictDialogOpen}
        handleFileConflict={handleFileConflict}
      />
    </div>
  )
}
