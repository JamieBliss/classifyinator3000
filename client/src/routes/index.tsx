import { createFileRoute } from '@tanstack/react-router'
import { DataTable } from '@/components/ui/data-table/data-table'
import { columns } from '@/components/ui/data-table/columns'
import { ProcessingFileErrorDialog } from '@/components/ui/processing-file-error-dialog'
import { useFileData } from '@/hooks/use-file-data'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const { data, setData, fileId, setFileId, onFileUploadSuccess, deleteFile } =
    useFileData()

  return (
    <div className="flex h-screen items-center justify-center w-full">
      <DataTable
        data={data}
        columns={columns}
        onFileUploadSuccess={onFileUploadSuccess}
        deleteFile={deleteFile}
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
