import { Pie, PieChart, Sector } from 'recharts'
import type { PieSectorDataItem } from 'recharts/types/polar/Pie'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
interface ClassificationPieChartProps {
  chartConfig: ChartConfig
  chartData: {
    classification: string
    score: number
    fill: string
  }[]
}

export const ClassificationPieChart = ({
  chartConfig,
  chartData,
}: ClassificationPieChartProps) => {
  return (
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
          activeShape={({ outerRadius = 0, ...props }: PieSectorDataItem) => (
            <Sector {...props} outerRadius={outerRadius + 10} />
          )}
        />
        <ChartLegend
          content={<ChartLegendContent nameKey="classification" />}
          className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
        />
      </PieChart>
    </ChartContainer>
  )
}
