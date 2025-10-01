'use client'

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { TrendingUp } from 'lucide-react'

export const description = 'A radar chart with a legend'

const chartData = [
  { scale: 'C', firstDay: 3, average: 2.5 },
  { scale: 'P', firstDay: 1, average: 3 },
  { scale: 'S', firstDay: 2, average: 3.5 },
]

const chartConfig = {
  firstDay: {
    label: 'First Day',
    color: 'var(--chart-1)',
  },
  average: {
    label: 'Average',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

export function ChartRadarLegend() {
  return (
    <Card className="gap-2 py-4 h-full w-full">
      <CardHeader className="items-center border-b [.border-b]:pb-3">
        <CardTitle>CPS</CardTitle>
        <CardDescription>Showing CPS for the last 2 weeks</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <RadarChart data={chartData}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <PolarAngleAxis dataKey="scale" />
            <PolarGrid radialLines={false} />
            <Radar
              dataKey="firstDay"
              fill="var(--color-firstDay)"
              fillOpacity={0}
              stroke="var(--color-firstDay)"
              strokeWidth={2}
            />
            <Radar
              dataKey="average"
              fill="var(--color-average)"
              fillOpacity={0}
              stroke="var(--color-average)"
              strokeWidth={2}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
