import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { DataTable } from '@/components/ui/data-table/data-table'
import { columns } from '@/components/ui/data-table/columns'
import {
  FileStatus,
  type SchemaFileRecordWithClassifications,
} from '@/types/types'
import { ProcessingFileErrorDialog } from '@/components/ui/processing-file-error-dialog'
import { useHandleFileError } from '@/hooks/use-handle-file-error'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
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
      setData(files)
    } catch (error) {
      console.error('Error fetching file list:', error)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchData()
    if (fileId === null) {
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
            setIsFileProcessingErrorDialogOpen(true)
          } else {
            setFileId(null)
          }

          setData((prevData) =>
            prevData.map((item) => {
              if (item.id === fileId) {
                setErrorFilename(item.filename)
                return { ...item, status }
              }
              return item
            }),
          )
        }
      } catch (error) {
        console.error('Error checking file status:', error)
      }
    }

    intervalRef.current = window.setInterval(checkStatus, 2000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [fileId])

  const onFileUploadSuccess = useCallback((uploadedFileId: number) => {
    setFileId(uploadedFileId)
    setData((prevData) =>
      prevData.map((item) =>
        item.id === uploadedFileId
          ? { ...item, status: FileStatus.Processing }
          : item,
      ),
    )
  }, [])

  return (
    <div className="flex h-screen items-center justify-center w-full">
      <DataTable
        data={data}
        columns={columns}
        onFileUploadSuccess={onFileUploadSuccess}
      />
      <ProcessingFileErrorDialog
        data={data}
        setData={setData}
        fileId={fileId}
        setFileId={setFileId}
      />
    </div>
  )
}
