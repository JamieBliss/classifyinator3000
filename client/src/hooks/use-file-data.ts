import { useState, useCallback, useEffect, useRef } from 'react'
import {
  FileStatus,
  type SchemaFileRecordWithClassifications,
} from '@/types/types'
import { useHandleFileError } from '@/hooks/use-handle-file-error'

export const useFileData = () => {
  const [fileId, setFileId] = useState<number | null>(null)
  const [data, setData] = useState<SchemaFileRecordWithClassifications[]>([])
  const apiUrl = import.meta.env.VITE_API_URL
  const intervalRef = useRef<number | null>(null)

  const { setIsFileProcessingErrorDialogOpen, setErrorFilename } =
    useHandleFileError({
      data,
      setFileId,
      setData,
    })

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/files/list`)
      if (!response.ok) throw new Error('Failed to fetch file list')
      const files = await response.json()
      const sortedFiles = files.map(
        (file: SchemaFileRecordWithClassifications) => {
          if (!file.classifications || file.classifications.length === 0) {
            return file
          }
          const sortedClassifications = file.classifications
            .map((classification) => ({
              ...classification,
              file_classification_scores:
                classification.file_classification_scores.sort(
                  (a, b) => b.classification_score - a.classification_score,
                ),
            }))
            .sort(
              (a, b) =>
                (b.file_classification_scores[0]?.classification_score ?? 0) -
                (a.file_classification_scores[0]?.classification_score ?? 0),
            )
          return {
            ...file,
            classifications: sortedClassifications,
          }
        },
      )
      setData(sortedFiles)
    } catch (error) {
      console.error('Error fetching file list:', error)
    }
  }, [apiUrl])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (fileId === null) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    const checkStatus = async () => {
      try {
        const res = await fetch(`${apiUrl}/files/status/${fileId}`)
        if (!res.ok) throw new Error('Failed to fetch file status')

        const { status } = await res.json()
        const stopStatus = [FileStatus.Failed, FileStatus.Completed]

        if (stopStatus.includes(status)) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }

          if (status === FileStatus.Failed) {
            const failedFile = data.find((item) => item.id === fileId)
            if (failedFile) {
              setErrorFilename(failedFile.filename)
            }
            setIsFileProcessingErrorDialogOpen(true)
          }

          setFileId(null)
          fetchData()
        }
      } catch (error) {
        console.error('Error checking file status:', error)
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }

    intervalRef.current = window.setInterval(checkStatus, 2000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [
    fileId,
    apiUrl,
    data,
    fetchData,
    setErrorFilename,
    setIsFileProcessingErrorDialogOpen,
  ])

  const onFileUploadSuccess = useCallback(
    (uploadedFileId: number) => {
      setFileId(uploadedFileId)
      fetchData()
    },
    [fetchData],
  )

  const deleteFile = useCallback(
    async (fileIdToDelete: number) => {
      try {
        const res = await fetch(`${apiUrl}/files/delete/${fileIdToDelete}`, {
          method: 'DELETE',
        })

        if (!res.ok) {
          throw new Error('Failed to delete file')
        }
        setData((currentData) =>
          currentData.filter((file) => file.id !== fileIdToDelete),
        )
      } catch (error) {
        console.error('Error deleting file:', error)
      }
    },
    [apiUrl],
  )

  return { data, setData, fileId, setFileId, onFileUploadSuccess, deleteFile }
}
