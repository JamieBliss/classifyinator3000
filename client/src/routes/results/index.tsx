import { createFileRoute } from '@tanstack/react-router'
import { DataTable } from './data-table'
import { useEffect, useState } from 'react'
import { columns } from './columns'

export const Route = createFileRoute('/results/')({
  component: RouteComponent,
})

function RouteComponent() {
  const [data, setData ] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = () => { 
    const apiUrl = import.meta.env.VITE_API_URL;
    fetch(`${apiUrl}/files/list`, {
      method: "GET",
    }).then(response => {
      response.json().then(data => {
        setData(data)
      })
    })
  }

  return <div className="flex h-screen items-center justify-center w-full"><DataTable data={data} columns={columns}/></div>
}
