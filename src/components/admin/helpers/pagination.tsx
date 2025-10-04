import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { PaginationState } from './types'

interface PaginationProps {
  pagination: PaginationState
  onPaginationChange: (pagination: PaginationState) => void
  loading?: boolean
}

export function Pagination({ pagination, onPaginationChange, loading = false }: PaginationProps) {
  const handlePageChange = (newPage: number) => {
    onPaginationChange({
      ...pagination,
      page: newPage
    })
  }

  return (
    <Card>
      <CardContent className="">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
            of {pagination.total} items
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={pagination.page === 1 || loading}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm">Page</span>
              <Input
                type="number"
                min={1}
                max={pagination.totalPages}
                value={pagination.page}
                onChange={(e) => {
                  const page = parseInt(e.target.value)
                  if (page >= 1 && page <= pagination.totalPages) {
                    handlePageChange(page)
                  }
                }}
                className="w-16 h-8"
                disabled={loading}
              />
              <span className="text-sm">of {pagination.totalPages}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.min(pagination.page + 1, pagination.totalPages))}
              disabled={pagination.page === pagination.totalPages || loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={pagination.page === pagination.totalPages || loading}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
