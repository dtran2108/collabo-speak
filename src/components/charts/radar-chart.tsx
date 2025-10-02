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

interface PISAData {
  scale: string
  firstDay: number
  lastDay: number
}

interface ChartRadarLegendProps {
  pisaData?: PISAData[]
}

const chartConfig = {
  firstDay: {
    label: 'First Day',
    color: 'var(--chart-1)',
  },
  lastDay: {
    label: 'Last Day',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

export function ChartRadarLegend({ pisaData = [] }: ChartRadarLegendProps) {
  const chartData = pisaData.length > 0 ? pisaData : [
    { scale: 'C', firstDay: 0, lastDay: 0 },
    { scale: 'P', firstDay: 0, lastDay: 0 },
    { scale: 'S', firstDay: 0, lastDay: 0 },
  ]

  if (pisaData.length === 0) {
    return (
      <Card className="gap-2 py-4 h-full w-full">
        <CardHeader className="items-center border-b [.border-b]:pb-3">
          <CardTitle>CPS</CardTitle>
          <CardDescription>Showing CPS for the last 2 weeks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    )
  }
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
              dataKey="lastDay"
              fill="var(--color-lastDay)"
              fillOpacity={0}
              stroke="var(--color-lastDay)"
              strokeWidth={2}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
