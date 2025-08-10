'use client'

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
import type { SchemaFileRecordWithClassifications } from '@/types/types'

interface ChartPieDonutActiveProps {
  row: SchemaFileRecordWithClassifications
}

export function ChartPieDonutActive({ row }: ChartPieDonutActiveProps) {
  let chartData: {
    classification: string
    score: number
    fill: string
  }[] = []

  const chartConfig = row.classifications.reduce(
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

  chartData = row.classifications.map((classificationData) => ({
    classification: classificationData.id.toString(),
    score: classificationData.classification_score * 100,
    fill: `var(--color-${classificationData.id})`,
  }))

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
      </CardContent>
    </Card>
  )
}
