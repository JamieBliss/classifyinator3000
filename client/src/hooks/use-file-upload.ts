import { useState, type ChangeEvent } from 'react'

interface UseFileUploadProps {
  onFileUploadSuccess: (fileId: number) => void
  setIsDialogOpen: (isOpen: boolean) => void
}

export type UploadStatus = 'idle' | 'success' | 'error'

export function useFileUpload({
  onFileUploadSuccess,
  setIsDialogOpen,
}: UseFileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [message, setMessage] = useState('')
  const [isFileConflictDialogOpen, setIsFileConflictDialogOpen] =
    useState(false)

  const handleCancel = () => {
    setSelectedFile(null)
    setUploadStatus('idle')
    setMessage('')
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
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
      const response = await fetch(
        `${apiUrl}/files/upload${override ? '?override=True' : ''}`,
        {
          method: 'POST',
          body: formData,
        },
      )

      const result = await response.json()
      if (response.ok) {
        setUploadStatus('success')
        setMessage(result.message ?? 'File uploaded successfully!')
        setSelectedFile(null) // Clear the file on successful upload
        onFileUploadSuccess(result.id)
        setIsDialogOpen(false)
      } else if (response.status === 409) {
        setIsFileConflictDialogOpen(true)
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

  const handleFileConflict = (override: boolean) => {
    if (override) {
      void handleUpload(true)
    } else {
      handleCancel()
    }
    setIsFileConflictDialogOpen(false)
  }

  return {
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
  }
}

