import type {
  SchemaFileRecord,
  SchemaFileRecordWithClassifications,
} from '@/types/types'
import { useState } from 'react'

interface useHandleFileErrorProps {
  data: SchemaFileRecordWithClassifications[]
  setFileId: (fileId: number | null) => void
  setData: (data: SchemaFileRecordWithClassifications[]) => void
}

export const useHandleFileError = ({
  setData,
  data,
  setFileId,
}: useHandleFileErrorProps) => {
  const [errorFilename, setErrorFilename] = useState<string | null>(null)
  const [isFileProcessingErrorDialogOpen, setIsFileProcessingErrorDialogOpen] =
    useState(false)
  const apiUrl = import.meta.env.VITE_API_URL

  const deleteFile = async (fileId: number) => {
    const res = await fetch(`${apiUrl}/files/delete/${fileId}`, {
      method: 'DELETE',
    })
    const json_response = await res.json()
    if (json_response.status !== 200) {
      setData(data.filter((item: any) => item.id !== fileId))
      setErrorFilename(null)
      setFileId(null)
      setIsFileProcessingErrorDialogOpen(false)
    }
  }
  return {
    deleteFile,
    errorFilename,
    isFileProcessingErrorDialogOpen,
    setIsFileProcessingErrorDialogOpen,
    setErrorFilename,
  }
}
