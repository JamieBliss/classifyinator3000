import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import {
  Loader2Icon,
  UploadCloud,
  File as FileIcon,
  CheckCircle,
  XCircle,
} from 'lucide-react'

interface FileInputProps {
  onFileUploadSuccess: (fileId: number) => void
  setIsDialogOpen: (isOpen: boolean) => void
}

export function FileInput({
  onFileUploadSuccess,
  setIsDialogOpen,
}: FileInputProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle')
  const [message, setMessage] = useState('')

  const handleCancel = () => {
    setSelectedFile(null)
    setUploadStatus('idle')
    setMessage('')
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0])
      setUploadStatus('idle') // Reset status when a new file is chosen
      setMessage('')
    } else {
      setSelectedFile(null)
    }
  }

  const handleUpload = async (override: boolean = false) => {
    if (!selectedFile || isLoading) return

    setIsLoading(true)
    setUploadStatus('idle')
    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const apiUrl = import.meta.env.VITE_API_URL
      const response = await fetch(`${apiUrl}/files/upload`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      if (response.ok) {
        setUploadStatus('success')
        setMessage(result.message ?? 'File uploaded successfully!')
        setSelectedFile(null) // Clear the file on successful upload
        onFileUploadSuccess(result.id)
        setIsDialogOpen(false)
      } else if (response.status === 409) {
        console.log('TODO: Handle conflict')
      } else {
        setUploadStatus('error')
        setMessage(result.message ?? 'An unknown error occurred.')
        console.error('Upload failed:', result)
      }
    } catch (error) {
      setUploadStatus('error')
      setMessage('An error occurred during upload. Please try again.')
      console.error('Error during upload:', error)
    } finally {
      setIsLoading(false)
    }
  }

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
          <div className="flex items-center gap-3">
            <FileIcon className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium truncate mr-2">
              {selectedFile.name}
            </span>
          </div>
          <Button
            onClick={() => handleUpload(false)}
            disabled={isLoading}
            size="sm"
          >
            {isLoading && <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />}
            {isLoading ? 'Uploading...' : 'Upload'}
          </Button>
          <Button
            onClick={handleCancel}
            disabled={isLoading}
            size="sm"
            className="ml-2"
            variant="destructive"
          >
            <XCircle className="w-4 h-4" />
          </Button>
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
    </div>
  )
}
