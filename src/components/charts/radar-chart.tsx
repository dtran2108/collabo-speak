'use client'

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from '@/components/ui/chart'

export const description = 'A radar chart with a legend'

// Custom tooltip component that positions away from corners
const CustomRadarTooltip = ({ active, payload, coordinate }: any) => {
  if (active && payload && payload.length) {
    // Calculate offset position to move tooltip away from corners
    const offsetX = 20
    const offsetY = -20

    return (
      <div
        className="bg-background border border-border rounded-lg shadow-lg p-3"
        style={{
          position: 'absolute',
          left: coordinate?.x ? coordinate.x + offsetX : 0,
          top: coordinate?.y ? coordinate.y + offsetY : 0,
          zIndex: 1000,
        }}
      >
        <div className="space-y-1 min-w-[200px]">
          <p className="font-medium text-sm">
            {payload[0]?.payload?.scale == '🗣️'
              ? 'Establishing and Maintaining a Shared Understanding'
              : payload[0]?.payload?.scale == '💡'
              ? 'Taking Appropriate Action to Solve the Problem'
              : 'Establishing and Maintaining Team Organization'}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">
                {entry.dataKey === 'firstSession'
                  ? 'First Session'
                  : 'Last Session'}
                :
              </span>
              <span className="font-medium">{entry.value}/4</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

interface PISAData {
  scale: string
  firstSession: number
  lastSession: number
}

interface ChartRadarLegendProps {
  pisaData?: PISAData[]
}

const chartConfig = {
  firstSession: {
    label: 'First Session',
    color: 'var(--chart-1)',
  },
  lastSession: {
    label: 'Last Session',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

export function ChartRadarLegend({ pisaData = [] }: ChartRadarLegendProps) {
  const chartData =
    pisaData.length > 0
      ? pisaData
      : [
          { scale: 'C', firstSession: 0, lastSession: 0 },
          { scale: 'P', firstSession: 0, lastSession: 0 },
          { scale: 'S', firstSession: 0, lastSession: 0 },
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
        <CardTitle>Collaborative Problem Solving</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[350px]"
        >
          <RadarChart data={chartData}>
            <ChartTooltip cursor={false} content={<CustomRadarTooltip />} />
            <PolarAngleAxis dataKey="scale" />
            <PolarRadiusAxis domain={[0, 4]} axisLine={false} tick={false} />
            <PolarGrid radialLines={false} />
            <Radar
              dataKey="firstSession"
              fill="var(--color-firstSession)"
              fillOpacity={0}
              stroke="var(--color-firstSession)"
              strokeWidth={2}
            />
            <Radar
              dataKey="lastSession"
              fill="var(--color-lastSession)"
              fillOpacity={0}
              stroke="var(--color-lastSession)"
              strokeWidth={2}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
