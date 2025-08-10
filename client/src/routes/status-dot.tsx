import { FileStatus } from '@/types/types'

export const StatusDot = ({ fileStatus }: { fileStatus: FileStatus }) => {
  let colorClass

  switch (fileStatus) {
    case FileStatus.Failed:
      colorClass = 'bg-red-500'
      break
    case FileStatus.Processing:
      colorClass = 'bg-yellow-500'
      break
    case FileStatus.Completed:
      colorClass = 'bg-green-500'
      break
    default:
      colorClass = 'bg-gray-300' // fallback color
  }

  return (
    <span
      className={`capitalize flex w-2 h-2 rounded-full ${colorClass} items-center`}
      aria-label={`Status: ${fileStatus}`}
      title={fileStatus}
    />
  )
}
