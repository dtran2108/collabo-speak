'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'
import {
  CarouselItem,
  CarouselContent,
  Carousel,
  type CarouselApi,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Ratings } from './rating'
import { Badge } from './ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'

export function OralProficiencyCard() {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!api) {
      return
    }
    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)
    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1)
    })
  }, [api])

  const SnapshotItem = () => {
    return (
      <CarouselItem className="flex items-center">
        <div className="flex-1 flex flex-col space-y-3">
          <div className="flex justify-between items-center">
            <Badge className="text-base bg-black">Snapshot</Badge>
            <small className="text-muted-foreground">
              *note: AI - illustration only
            </small>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold">C - Completion</span>
            <div className="border border-gray-100 rounded-full p-4 flex items-center justify-center space-x-3">
              <Ratings
                className="flex space-x-2"
                rating={2.5}
                variant="yellow"
                size={20}
              />
              <span className="text-sm text-muted-foreground">
                2.5 out of 5
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold">A - Completion</span>
            <div className="border border-gray-100 rounded-full p-4 flex items-center justify-center space-x-3">
              <Ratings
                className="flex space-x-2"
                rating={2.5}
                variant="yellow"
                size={20}
              />
              <span className="text-sm text-muted-foreground">
                2.5 out of 5
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold">F - Fillers</span>
            <div className="border border-gray-100 rounded-full p-4 flex items-center justify-center space-x-3">
              <Ratings
                className="flex space-x-2"
                rating={2.5}
                variant="yellow"
                size={20}
              />
              <span className="text-sm text-muted-foreground">
                2.5 out of 5
              </span>
            </div>
          </div>
        </div>
      </CarouselItem>
    )
  }

  const DeepDiveItem = () => {
    // Higher values are better
    const higherIsBetter = [
      { item: 'WPM', day1: 180, average: 90 },
      { item: 'Clauses', day1: 80, average: 70 },
      { item: 'TTK', day1: 10, average: 100 },
    ]

    // Lower values are better
    const lowerIsBetter = [
      { item: 'Error', day1: 30, average: 50 },
      { item: 'Fillers', day1: 90, average: 10 },
    ]

    const getArrow = (
      day1: number,
      average: number,
      higherIsBetter: boolean,
    ) => {
      if (higherIsBetter) {
        // For higher is better: green arrow up when average > day1, red arrow down when average < day1
        if (average > day1) {
          return <span className="text-green-500">↗</span>
        } else if (average < day1) {
          return <span className="text-red-500">↘</span>
        } else {
          return <span className="text-gray-500">→</span>
        }
      } else {
        // For lower is better: green arrow down when average < day1, red arrow up when average > day1
        if (average < day1) {
          return <span className="text-green-500">↘</span>
        } else if (average > day1) {
          return <span className="text-red-500">↗</span>
        } else {
          return <span className="text-gray-500">→</span>
        }
      }
    }

    const renderTable = (data: typeof higherIsBetter, title: string) => {
      const isHigherBetter = title === 'Higher is Better'
      const badgeColor = isHigherBetter
        ? 'bg-green-100 text-green-800 border-green-200'
        : 'bg-purple-100 text-purple-800 border-purple-200'
      const headerColor = isHigherBetter
        ? 'bg-green-50 text-green-900'
        : 'bg-purple-50 text-purple-900'

      return (
        <div className="space-y-3">
          <div className="flex justify-end items-center">
            <Badge className={`text-sm border ${badgeColor}`}>{title}</Badge>
          </div>

          <Table>
            <TableHeader>
              <TableRow className={headerColor}>
                <TableHead className="text-xs font-semibold">Item</TableHead>
                <TableHead className="text-center text-xs font-semibold">
                  Day 1
                </TableHead>
                <TableHead className="text-center text-xs font-semibold">
                  Average
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium capitalize text-xs">
                    {row.item}
                  </TableCell>
                  <TableCell className="text-center text-xs">
                    {row.day1}
                  </TableCell>
                  <TableCell className="text-center text-xs">
                    <div className="flex items-center justify-center space-x-2">
                      <span>{row.average}</span>
                      {getArrow(
                        row.day1,
                        row.average,
                        title === 'Higher is Better',
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )
    }

    return (
      <CarouselItem>
        <div className="flex flex-col space-y-6">
          <div className="flex items-center">
            <Badge className="text-base bg-black">Deep dive</Badge>
          </div>

          {renderTable(higherIsBetter, 'Higher is Better')}
          {renderTable(lowerIsBetter, 'Lower is Better')}
        </div>
      </CarouselItem>
    )
  }

  return (
    <Card className="h-full w-full">
      <CardHeader className="border-b">
        <CardTitle>Oral Proficiency</CardTitle>
        <CardDescription>
          Performance metrics with directional indicators
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mx-auto max-w-full">
          <Carousel
            opts={{
              align: 'start',
              loop: true,
            }}
            setApi={setApi}
            className="w-full max-w-[90%] mx-auto"
          >
            <CarouselContent>
              <SnapshotItem />
              <DeepDiveItem />
            </CarouselContent>
            <CarouselPrevious className="border-none" />
            <CarouselNext className="border-none" />
          </Carousel>
          <div className="text-muted-foreground py-2 text-center text-sm">
            {current} of {count}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
