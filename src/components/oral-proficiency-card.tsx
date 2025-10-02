'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from './ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart'
import {
  Line,
  Bar,
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
} from 'recharts'

interface WeeklyData {
  week: string
  wpm: number
  fillers: number
  participation: number
}

interface OralProficiencyCardProps {
  weeklyData?: WeeklyData[]
}

export function OralProficiencyCard({ weeklyData = [] }: OralProficiencyCardProps) {
  const WPMFillersChart = () => {
    const chartData = weeklyData.map(item => ({
      week: item.week,
      wpm: item.wpm,
      fillers: item.fillers
    }))

    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          No data available
        </div>
      )
    }

    return (
      <div className="flex-1 flex flex-col space-y-4">
        <div className="h-64 w-full">
          <ChartContainer
            config={{
              wpm: {
                label: 'Words per Minute',
                color: '#3b82f6', // Blue
              },
              fillers: {
                label: 'Fillers per Minute',
                color: '#f59e0b', // Orange
              },
            }}
            className="h-full w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="wpm"
                  orientation="left"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  domain={['dataMin - 10', 'dataMax + 10']}
                />
                <YAxis
                  yAxisId="fillers"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 'dataMax + 2']}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => `Week: ${value}`}
                      formatter={(value, name) => [
                        <div key={name} className="flex items-center space-x-2">
                          {name === 'wpm' ? (
                            <div className="w-3 h-3 bg-[#3b82f6] rounded-none"></div>
                          ) : (
                            <div className="w-3 h-0.5 bg-[#f59e0b] rounded-sm"></div>
                          )}
                          <span className="text-muted-foreground">
                            {value}{' '}
                            {name === 'wpm' ? 'words/minute' : 'fillers/minute'}
                          </span>
                        </div>,
                      ]}
                    />
                  }
                />
                <Bar
                  yAxisId="wpm"
                  dataKey="wpm"
                  fill="#3b82f6"
                  radius={[2, 2, 0, 0]}
                  opacity={0.7}
                />
                <Line
                  yAxisId="fillers"
                  dataKey="fillers"
                  type="monotone"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <div className="flex justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[#3b82f6] rounded-none"></div>
            <span className="text-muted-foreground text-base">Words per Minute</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-[#f59e0b] rounded-sm"></div>
            <span className="text-muted-foreground text-base">Fillers per Minute</span>
          </div>
        </div>
      </div>
    )
  }

  const ParticipationChart = () => {
    const chartData = weeklyData.map(item => ({
      week: item.week,
      participation: item.participation
    }))

    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          No data available
        </div>
      )
    }

    return (
      <div className="flex-1 flex flex-col space-y-4">
        <div className="h-64 w-full">
          <ChartContainer
            config={{
              participation: {
                label: '% of Speaking Time',
                color: '#10b981', // Green
              },
            }}
            className="h-full w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => `Week: ${value}`}
                      formatter={(value, name) => [
                        <div key={name} className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-[#10b981] rounded-none"></div>
                          <span className="text-muted-foreground">
                            {value}%
                          </span>
                        </div>,
                      ]}
                    />
                  }
                />
                <Bar
                  dataKey="participation"
                  fill="#10b981"
                  radius={[2, 2, 0, 0]}
                  opacity={0.7}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <div className="flex justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[#10b981] rounded-none"></div>
            <span className="text-muted-foreground text-base">% of Speaking Time</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="h-full w-full py-4">
      <CardHeader className="border-b [.border-b]:pb-3">
        <CardTitle>Oral Proficiency</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="mx-auto max-w-full grid grid-cols-2 gap-4">
          <WPMFillersChart />
          <ParticipationChart />
        </div>
      </CardContent>
    </Card>
  )
}
