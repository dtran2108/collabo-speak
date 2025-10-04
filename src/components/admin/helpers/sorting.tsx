import React from 'react'
import { Button } from '@/components/ui/button'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'

interface SortableHeaderProps {
  column: {
    getCanSort: () => boolean
    toggleSorting: (asc: boolean) => void
    getIsSorted: () => false | 'asc' | 'desc'
  }
  children: React.ReactNode
}

export function SortableHeader({ column, children }: SortableHeaderProps) {
  const canSort = column.getCanSort()
  
  if (!canSort) {
    return <div className="flex items-center">{children}</div>
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-semibold hover:bg-transparent"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      <div className="flex items-center gap-2">
        {children}
        {column.getIsSorted() === 'asc' ? (
          <ArrowUp className="h-4 w-4" />
        ) : column.getIsSorted() === 'desc' ? (
          <ArrowDown className="h-4 w-4" />
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-50" />
        )}
      </div>
    </Button>
  )
}
