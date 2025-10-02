'use client'

import {
  Card,
  CardContent,
  CardDescription,
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

export function OralProficiencyCard() {
  const SnapshotItem = () => {
    // Sample data for the chart - in a real app, this would come from props or API
    const chartData = [
      { date: '2024-01-01', wpm: 120, fillers: 8 },
      { date: '2024-01-02', wpm: 135, fillers: 6 },
      { date: '2024-01-03', wpm: 142, fillers: 4 },
    ]

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
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  }
                />
                <YAxis
                  yAxisId="wpm"
                  orientation="left"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[100, 170]}
                />
                <YAxis
                  yAxisId="fillers"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 10]}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) =>
                        `Date: ${new Date(value).toLocaleDateString()}`
                      }
                      formatter={(value, name) => [
                        <div key={name} className="flex items-center space-x-2">
                          {name === 'wpm' ? (
                            <div className="w-3 h-3 bg-[#f59e0b] rounded-none"></div>
                          ) : (
                            <div className="w-3 h-0.5 bg-[#3b82f6] rounded-sm"></div>
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
                  fill="#f59e0b"
                  radius={[2, 2, 0, 0]}
                  opacity={0.7}
                />
                <Line
                  yAxisId="fillers"
                  dataKey="fillers"
                  type="monotone"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <div className="flex justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[#f59e0b] rounded-none"></div>
            <span className="text-muted-foreground">Words per Minute</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-[#3b82f6] rounded-sm"></div>
            <span className="text-muted-foreground">Fillers per Minute</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="h-full w-full py-4">
      <CardHeader className="border-b [.border-b]:pb-3">
        <CardTitle>Oral Proficiency</CardTitle>
        <CardDescription>
          Performance metrics with directional indicators
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="mx-auto max-w-full grid grid-cols-2 gap-4">
          <SnapshotItem />
          <SnapshotItem />
        </div>
      </CardContent>
    </Card>
  )
}
