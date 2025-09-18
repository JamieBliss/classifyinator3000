import type { ChartConfig } from '@/components/ui/chart'
import type {
  SchemaFileClassificationWithScoresAndChunks,
  SchemaFileRecordWithClassifications,
} from '@/types/types'
import { useEffect, useMemo, useState } from 'react'

type ChartDataType = {
  classification: string
  score: number
  fill: string
}[]

const generateClassificationKey = (
  classification: SchemaFileClassificationWithScoresAndChunks,
) => {
  return `${classification.model}-${classification.file_id}-${classification.multi_label}-${classification.chunking_strategy}-${classification.chunk_size}-${classification.chunk_overlap_size}`
}

export const useClassificationData = (
  row: SchemaFileRecordWithClassifications | undefined,
) => {
  const classifications = useMemo(() => {
    if (!row) return {}
    return row.classifications?.reduce<
      Record<string, SchemaFileClassificationWithScoresAndChunks>
    >((acc, classification) => {
      const key = generateClassificationKey(classification)
      acc[key] = classification
      return acc
    }, {})
  }, [row])

  const [selectedClassificationKey, setSelectedClassificationKey] = useState<
    string | null
  >(null)

  useEffect(() => {
    if (row && row.classifications!.length > 0) {
      const highestClassification = row.classifications![0]
      const highestClassificationKey = generateClassificationKey(
        highestClassification,
      )
      setSelectedClassificationKey(highestClassificationKey)
    } else {
      setSelectedClassificationKey(null)
    }
  }, [row])

  const selectedClassification = useMemo<
    SchemaFileClassificationWithScoresAndChunks | undefined
  >(() => {
    if (!selectedClassificationKey) return undefined
    return classifications![selectedClassificationKey]
  }, [selectedClassificationKey, classifications])

  const chartConfig: ChartConfig = useMemo(() => {
    if (!selectedClassification) return {}
    return selectedClassification.file_classification_scores.reduce(
      (acc, classification) => ({
        ...acc,
        [classification.id]: {
          label: classification.classification,
          color: `var(--chart-${classification.classification.toLowerCase().replace(/ /g, '-')})`,
        },
      }),
      {},
    )
  }, [selectedClassification])

  const chartData = useMemo<ChartDataType>(() => {
    if (!selectedClassification) return []
    return selectedClassification.file_classification_scores.map(
      (classificationData) => ({
        classification: classificationData.id.toString(),
        score: classificationData.classification_score * 100,
        fill: `var(--color-${classificationData.id})`,
      }),
    )
  }, [selectedClassification])

  return {
    classifications,
    selectedClassificationKey,
    setSelectedClassificationKey,
    selectedClassification,
    chartConfig,
    chartData,
  }
}
