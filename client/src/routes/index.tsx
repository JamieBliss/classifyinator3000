import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { columns } from '@/components/ui/columns'
import {
  FileStatus,
  type SchemaFileRecordWithClassifications,
} from '@/types/types'
import { Dialog, DialogClose, DialogDescription } from '@radix-ui/react-dialog'
import {
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const [fileId, setFileId] = useState<number | null>(null)
  const [errorFilename, setErrorFilename] = useState<string | null>(null)
  const [data, setData] = useState<SchemaFileRecordWithClassifications[]>([])
  const [isFileProcessingErrorDialogOpen, setIsFileProcessingErrorDialogOpen] =
    useState(false)
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
      const json_response = await res.json()
      let status = json_response.status
      const stop_status = [FileStatus.Failed, FileStatus.Completed]
      if (stop_status.includes(status) && intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
        // Notify user of error if file status is failed
        if (status === FileStatus.Failed) {
          setIsFileProcessingErrorDialogOpen(true)
        } else {
          setFileId(null)
        }
        const updatedData = data.map(
          (item: SchemaFileRecordWithClassifications) => {
            setErrorFilename(item.filename)
            if (item.id === fileId) {
              return {
                ...item,
                status,
              }
            }
            return item
          },
        )
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
    setData(
      data.map((item: SchemaFileRecordWithClassifications) => {
        if (item.id === fileId) {
          return {
            ...item,
            status: FileStatus.Processing,
          }
        }
        return item
      }),
    )
  }

  const deleteFile = async () => {
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

  return (
    <div className="flex h-screen items-center justify-center w-full">
      <DataTable
        data={data}
        columns={columns}
        onFileUploadSuccess={onFileUploadSuccess}
      />
      <Dialog
        open={isFileProcessingErrorDialogOpen}
        onOpenChange={setIsFileProcessingErrorDialogOpen}
      >
        <DialogContent>
          <DialogTitle>Error processing {errorFilename}</DialogTitle>
          <DialogDescription>
            There was an error processing the file, please ensure it isn't
            corrupted and is a valid, txt, pdf or docx. <br />
            <br /> You now have two options either leave the file which gives
            you the opportunity to delete at another time, or delete now.
          </DialogDescription>

          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="outline"
                onClick={() => {
                  setErrorFilename(null)
                  setFileId(null)
                  setIsFileProcessingErrorDialogOpen(false)
                }}
              >
                Close
              </Button>
            </DialogClose>
            <Button
              type="submit"
              onClick={() => deleteFile()}
              variant="destructive"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
