import { useState, type FormEvent } from 'react'

export type ChunkTypes = 'Number' | 'Paragraph'

interface ProcessFileFormProps {
  rowId: number
  onFileProcessStart: (fileId: number) => void
  closeDialog: () => void
}

export type Models =
  | 'facebook/bart-large-mnli'
  | 'knowledgator/comprehend_it-base'
  | 'Qwen/Qwen3-Embedding-0.6B'

export const useProcessFile = ({
  rowId,
  onFileProcessStart,
  closeDialog,
}: ProcessFileFormProps) => {
  const [model, setModel] = useState<Models>('knowledgator/comprehend_it-base')
  const [chunkType, setChunkType] = useState<ChunkTypes>('Paragraph')
  const [chunkSize, setChunkSize] = useState<number>(200)
  const [chunkOverlapSize, setChunkOverlapSize] = useState<number>(50)
  const [multiLabel, setMultiLabel] = useState<boolean>(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const apiUrl = import.meta.env.VITE_API_URL
    const body = {
      file_id: rowId,
      model,
      chunking_strategy: chunkType,
      chunk_size: chunkType === 'Number' ? chunkSize : undefined,
      overlap: chunkType === 'Number' ? chunkOverlapSize : undefined,
      multi_label: multiLabel,
    }
    const response = await fetch(apiUrl + '/files/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const result = await response.json()
    if (response.ok) {
      onFileProcessStart(result.id)
      closeDialog()
    }
  }

  return {
    model,
    chunkType,
    chunkSize,
    chunkOverlapSize,
    multiLabel,
    setModel,
    setChunkType,
    setChunkSize,
    setChunkOverlapSize,
    setMultiLabel,
    handleSubmit,
  }
}
