import type { SchemaFileRecordWithClassifications } from '@/types/types'
import { useState, type FormEvent } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'
import { Input } from './input'
import { Label } from './label'
import { Checkbox } from './checkbox'
import { Button } from './button'
import { Collapsible, CollapsibleContent } from './collapsible'
import { ChevronsUpDown } from 'lucide-react'
import { useProcessFile, type ChunkTypes } from '@/hooks/use-process-file'

interface ProcessFileFormProps {
  rowId: number
  onFileProcessStart: (fileId: number) => void
  closeDialog: () => void
  defaultIsOpen: boolean
}

export const ProcessFileForm = ({
  rowId,
  onFileProcessStart,
  closeDialog,
  defaultIsOpen,
}: ProcessFileFormProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(defaultIsOpen)
  const {
    chunkType,
    chunkSize,
    chunkOverlapSize,
    multiLabel,
    setChunkType,
    setChunkSize,
    setChunkOverlapSize,
    setMultiLabel,
    handleSubmit,
  } = useProcessFile({
    rowId: rowId,
    onFileProcessStart,
    closeDialog,
  })
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-medium">Re-process File</h3>
          <p className="text-sm text-muted-foreground">
            Adjust the parameters below and re-run the classification process
            for this file.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronsUpDown />
          <span className="sr-only">Toggle</span>
        </Button>
      </div>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <form onSubmit={handleSubmit} className="grid gap-6 pt-6 w-full">
            <div className="flex flex-wrap items-end gap-4">
              <div className="grid gap-2">
                <Label htmlFor="chunkType">Chunking Strategy</Label>
                <Select
                  value={chunkType}
                  onValueChange={(value) => setChunkType(value as ChunkTypes)}
                >
                  <SelectTrigger id="chunkType">
                    <SelectValue placeholder="Select a chunk type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={'Number'}>Number of tokens</SelectItem>
                    <SelectItem value={'Paragraph'}>By paragraph</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="chunkSize">Chunk Size</Label>
                <Input
                  id="chunkSize"
                  type="number"
                  disabled={chunkType !== 'Number'}
                  value={chunkSize}
                  onChange={(e) => setChunkSize(parseInt(e.target.value, 10))}
                  className="w-[120px]"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="chunkOverlapSize">Chunk Overlap Size</Label>
                <Input
                  id="chunkOverlapSize"
                  type="number"
                  disabled={chunkType !== 'Number'}
                  value={chunkOverlapSize}
                  max={chunkSize}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10)
                    setChunkOverlapSize(value)
                  }}
                  className="w-[120px]"
                />
              </div>
              <div className="flex items-center h-9 gap-2">
                <Checkbox
                  id="multiLabel"
                  checked={multiLabel}
                  onCheckedChange={() => setMultiLabel(!multiLabel)}
                />
                <Label htmlFor="multiLabel">Multi-Label</Label>
              </div>
            </div>
            <Button type="submit" className="w-full sm:w-auto sm:ml-auto">
              Process file
            </Button>
          </form>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
