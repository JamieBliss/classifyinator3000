import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Rectangle,
  XAxis,
  YAxis,
} from 'recharts'

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

interface ClassificationPieChartProps {
  chartConfig: ChartConfig
  chartData: {
    classification: string
    score: number
    fill: string
  }[]
}

export function ClassificationBarChart({
  chartConfig,
  chartData,
}: ClassificationPieChartProps) {
  return (
    <ChartContainer config={chartConfig}>
      <BarChart
        accessibilityLayer
        data={chartData}
        layout="vertical"
        margin={{ left: 50, right: 20 }}
      >
        <CartesianGrid horizontal={false} vertical={false} stroke="#fff" />
        <XAxis type="number" dataKey="score" hide />
        <YAxis
          dataKey="classification"
          type="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(_, index) => {
            return chartConfig[chartData[index].classification].label as string
          }}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Bar
          dataKey="score"
          strokeWidth={2}
          radius={8}
          activeIndex={0}
          activeBar={({ ...props }) => (
            <Rectangle
              {...props}
              fillOpacity={0.8}
              stroke={props.payload.fill}
              strokeDasharray={4}
              strokeDashoffset={4}
            />
          )}
        >
          <LabelList
            dataKey="score"
            position="right"
            offset={8}
            formatter={(value: number) => `${Math.round(value)}%`}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
