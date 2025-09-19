import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { SchemaFileRecordWithClassifications } from '@/types/types'
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip'
import { Select } from '@radix-ui/react-select'
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select'
import { Label } from '../label'
import { Info } from 'lucide-react'
import { ClassificationPieChart } from './classification-pie-chart'
import { ClassificationBarChart } from './classification-bar-chart'
import type { useClassificationData } from '@/hooks/use-classification-data'

type ClassificationData = ReturnType<typeof useClassificationData>

interface ClassificationChartProps extends ClassificationData {
  row: SchemaFileRecordWithClassifications
}

export function ClassificationChart({
  row,
  classifications,
  selectedClassificationKey,
  setSelectedClassificationKey,
  chartConfig,
  chartData,
}: ClassificationChartProps) {
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
        {chartData.length > 0 ? (
          classifications![selectedClassificationKey!].multi_label === true ? (
            <ClassificationBarChart
              chartConfig={chartConfig}
              chartData={chartData}
            />
          ) : (
            <ClassificationPieChart
              chartConfig={chartConfig}
              chartData={chartData}
            />
          )
        ) : (
          <div className="mx-auto flex aspect-square max-h-[400px] items-center justify-center">
            <p>No classification data to display.</p>
          </div>
        )}
        <div className="grid gap-2 mt-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="classification">Classifications</Label>
            <Tooltip defaultOpen={false}>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent>
                model: model name
                <br />
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
              {Object.keys(classifications!).map((key) => {
                const {
                  multi_label,
                  chunking_strategy,
                  chunk_size,
                  chunk_overlap_size,
                } = classifications![key]
                return (
                  <SelectItem key={key} value={key}>
                    model: {classifications![key].model}, cstrat:{' '}
                    {chunking_strategy}, cs: {chunk_size || 'N/A'}, co:{' '}
                    {chunk_overlap_size || 'N/A'}, ml:{' '}
                    {multi_label === true ? 'true' : 'false'}
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
