import { Button } from '@/components/ui/button'
import { FileInput } from '@/components/ui/fileInput'
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[18px] row-start-2 items-center w-auto">
        <FileInput />
        <Link to="/results" className='w-full'>
          <Button size="sm" variant="secondary" className="w-full">
            View Results
          </Button>
        </Link>
      </main>
    </div>
  )
}
