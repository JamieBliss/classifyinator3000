import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { DataTable } from './data-table'
import { columns } from './columns'
import {
  FileStatus,
  type SchemaFileRecordWithClassifications,
} from '@/types/types'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const [fileId, setFileId] = useState<number | null>(null)
  const [data, setData] = useState<SchemaFileRecordWithClassifications[]>([])
  const apiUrl = import.meta.env.VITE_API_URL
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchData()
    if (fileId === null) {
      return
    }
    intervalRef.current = setInterval(async () => {
      const res = await fetch(`${apiUrl}/files/status/${fileId}`, {
        method: 'GET',
      })
      const data = await res.json()
      let status = data.status
      const stop_status = [FileStatus.Failed, FileStatus.Completed]
      if (stop_status.includes(status) && intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
        setFileId(null)
        const updatedData = data.map((item: any) => {
          if (item.id === fileId) {
            return {
              ...item,
              status,
            }
          }
          return item
        })
        setData(updatedData)
      }
    }, 2000)
  }, [fileId])

  const fetchData = () => {
    fetch(`${apiUrl}/files/list`, {
      method: 'GET',
    }).then((response) => {
      response.json().then((data) => {
        setData(data)
      })
    })
  }

  const onFileUploadSuccess = (fileId: number) => {
    setFileId(fileId)
  }
  return (
    <div className="flex h-screen items-center justify-center w-full">
      <DataTable
        data={data}
        columns={columns}
        onFileUploadSuccess={onFileUploadSuccess}
      />
    </div>
  )
}
