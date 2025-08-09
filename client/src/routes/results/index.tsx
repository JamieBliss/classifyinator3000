import { createFileRoute } from '@tanstack/react-router'
import { DataTable } from './data-table'

export const Route = createFileRoute('/results/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>insert datatable here</div>
}
