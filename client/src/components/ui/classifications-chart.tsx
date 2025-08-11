import { Pie, PieChart, Sector } from 'recharts'
import type { PieSectorDataItem } from 'recharts/types/polar/Pie'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type {
  SchemaFileClassificationRead,
  SchemaFileRecordWithClassifications,
} from '@/types/types'
import { useEffect, useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'
import { Select } from '@radix-ui/react-select'
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Label } from './label'
import { Info } from 'lucide-react'

interface ChartPieDonutActiveProps {
  row: SchemaFileRecordWithClassifications
}

export function ChartPieDonutActive({ row }: ChartPieDonutActiveProps) {
  type chartDataType = {
    classification: string
    score: number
    fill: string
  }[]

  const classifications = row.classifications.reduce<
    Record<string, SchemaFileClassificationRead[]>
  >((acc, classification) => {
    const key = `${classification.file_id}-${classification.multi_label}-${classification.chunking_strategy}-${classification.chunk_size}-${classification.chunk_overlap_size}`

    if (!acc[key]) {
      acc[key] = []
    }

    acc[key].push(classification)
    return acc
  }, {})

  const [selectedClassificationKey, setSelectedClassificationKey] = useState<
    string | null
  >(null)
  const [selectedClassification, setSelectedClassification] = useState<
    SchemaFileClassificationRead[]
  >([])

  const chartConfig = selectedClassification.reduce(
    (acc, classification, index) => {
      return {
        ...acc,
        [classification.id]: {
          label: classification.classification,
          color: `var(--chart-${index + 1})`,
        },
      }
    },
    {},
  )
  const [chartData, setChartData] = useState<chartDataType>([])

  useEffect(() => {
    // by default we display the highest classification score so we should show the corresponding chart
    const highestClassification = row.classifications[0]
    const highestClassificationKey = `${highestClassification.file_id}-${highestClassification.multi_label}-${highestClassification.chunking_strategy}-${highestClassification.chunk_size}-${highestClassification.chunk_overlap_size}`
    setSelectedClassificationKey(highestClassificationKey)
    setSelectedClassification(classifications[highestClassificationKey])
  }, [])

  useEffect(() => {
    if (!selectedClassificationKey) return
    setSelectedClassification(classifications[selectedClassificationKey])
    const newSelectedClassification = classifications[selectedClassificationKey]
    const newData = newSelectedClassification.map((classificationData) => ({
      classification: classificationData.id.toString(),
      score: classificationData.classification_score * 100,
      fill: `var(--color-${classificationData.id})`,
    }))
    setChartData(newData)
  }, [selectedClassificationKey])

  const createdAtDate = new Date(
    row.updated_at.replace(/(\.\d{3})\d+$/, '$1'),
  ).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <Card className="flex flex-col border-none">
      <CardHeader className="items-center pb-0">
        <CardTitle>{row.filename} - Classification</CardTitle>
        <CardDescription>{createdAtDate}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[400px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="score"
              nameKey="classification"
              innerRadius={60}
              outerRadius={100}
              strokeWidth={5}
              activeIndex={0}
              activeShape={({
                outerRadius = 0,
                ...props
              }: PieSectorDataItem) => (
                <Sector {...props} outerRadius={outerRadius + 10} />
              )}
            />
            <ChartLegend
              content={<ChartLegendContent nameKey="classification" />}
              className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
            />
          </PieChart>
        </ChartContainer>
        <div className="grid gap-2 mt-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="classification">Classifications</Label>
            <Tooltip defaultOpen={false}>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent>
                cstrat: chunking strategy
                <br />
                cs: chunk size
                <br />
                co: chunk overlap
                <br />
                ml: multi label
              </TooltipContent>
            </Tooltip>
          </div>
          <Select
            value={selectedClassificationKey!}
            onValueChange={setSelectedClassificationKey}
          >
            <SelectTrigger id="classifications">
              <SelectValue placeholder="Select a classification" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(classifications).map((key) => {
                const {
                  multi_label,
                  chunking_strategy,
                  chunk_size,
                  chunk_overlap_size,
                } = classifications[key][0]
                return (
                  <SelectItem key={key} value={key}>
                    cstrat: {chunking_strategy}, cs: {chunk_size}, co:{' '}
                    {chunk_overlap_size}, ml:{' '}
                    {multi_label === true ? 'yes' : 'no'}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
