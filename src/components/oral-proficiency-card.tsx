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
      <CarouselItem>
        <div className="flex flex-col space-y-3">
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
    const data = [
      { item: 'WPM', day1: 180, average: 90 },
      { item: 'Clauses', day1: 80, average: 70 },
      { item: 'TTK', day1: 10, average: 100 },
      { item: 'error', day1: 30, average: 50 },
      { item: 'fillers', day1: 90, average: 10 },
    ]

    const getArrow = (day1: number, average: number) => {
      if (average > day1) {
        return <span className="text-green-500">↗</span>
      } else if (average < day1) {
        return <span className="text-red-500">↘</span>
      } else {
        return <span className="text-gray-500">→</span>
      }
    }

    return (
      <CarouselItem>
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <Badge className="text-base bg-black">Deep dive</Badge>
            <small className="text-muted-foreground">Go up = Good</small>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-center">Day 1</TableHead>
                <TableHead className="text-center">Average</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium capitalize">
                    {row.item}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.day1}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <span>{row.average}</span>
                      {getArrow(row.day1, row.average)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CarouselItem>
    )
  }

  return (
    <Card className="h-full w-full">
      <CardHeader className="border-b">
        <CardTitle>Oral Proficiency</CardTitle>
        <CardDescription>Go up = Good</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mx-auto max-w-full">
          <Carousel setApi={setApi} className="w-full max-w-[90%] mx-auto">
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
