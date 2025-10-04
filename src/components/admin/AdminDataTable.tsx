'use client'

import React from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  SortingState,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TableRowSkeleton } from '@/components/ui/table-skeleton'
import { Plus } from 'lucide-react'

// Import helper components and types
import {
  PaginationState,
  FilterConfig,
  Pagination,
  SortableHeader,
  SearchInput,
  FiltersContainer,
} from './helpers'

export interface AdminDataTableProps<TData> {
  // Data
  data: TData[]
  columns: ColumnDef<TData>[]
  
  // Loading and error states
  loading?: boolean
  error?: string | null
  
  // Pagination
  pagination: PaginationState
  onPaginationChange: (pagination: PaginationState) => void
  
  // Sorting
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
  
  // Filtering
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  
  // Dynamic filters
  filters?: FilterConfig[]
  
  // Actions
  onAddItem?: () => void
  addButtonText?: string
  
  // Custom empty state
  emptyStateMessage?: string
}

export function AdminDataTable<TData>({
  data,
  columns,
  loading = false,
  error = null,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  onAddItem,
  addButtonText = "Add Item",
  emptyStateMessage = "No data found."
}: AdminDataTableProps<TData>) {
  
  // Table configuration
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: (updaterOrValue: SortingState | ((old: SortingState) => SortingState)) => {
      const newSorting = typeof updaterOrValue === 'function' 
        ? updaterOrValue(sorting) 
        : updaterOrValue
      onSortingChange(newSorting)
    },
    onColumnFiltersChange: () => {}, // We handle filtering externally
    onGlobalFilterChange: onSearchChange,
    state: {
      sorting,
      globalFilter: searchValue,
    },
    manualPagination: true,
    manualSorting: true, // Enable manual sorting to prevent client-side sorting
    pageCount: pagination.totalPages,
  })


  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 w-full">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          disabled={loading}
        />
        
        {/* Dynamic Filters */}
        <FiltersContainer filters={filters} />
        
        {onAddItem && (
          <Button onClick={onAddItem} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {addButtonText}
          </Button>
        )}
      </div>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-w-full">
            <Table className="table-auto">
              <TableHeader>
                {(() => {
                  try {
                    // Check if table exists and has required methods
                    if (!table || typeof table.getHeaderGroups !== 'function') {
                      return (
                        <TableRow>
                          <TableHead colSpan={columns.length} className="h-12 text-center">
                            Table not initialized
                          </TableHead>
                        </TableRow>
                      )
                    }
                    
                    const headerGroups = table.getHeaderGroups()
                    if (!headerGroups || !Array.isArray(headerGroups)) {
                      return (
                        <TableRow>
                          <TableHead colSpan={columns.length} className="h-12 text-center">
                            Header groups not available
                          </TableHead>
                        </TableRow>
                      )
                    }
                    
                    return headerGroups.map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))
                  } catch (error) {
                    console.error('Error rendering table header:', error)
                    return (
                      <TableRow>
                        <TableHead colSpan={columns.length} className="h-12 text-center text-red-500">
                          Error rendering header: {error instanceof Error ? error.message : 'Unknown error'}
                        </TableHead>
                      </TableRow>
                    )
                  }
                })()}
              </TableHeader>
              <TableBody>
                {(() => {
                  try {
                    // Comprehensive null checks for table and its methods
                    if (!table || typeof table.getRowModel !== 'function') {
                      return (
                        <TableRow>
                          <TableCell
                            colSpan={columns.length}
                            className="h-24 text-center"
                          >
                            Table not initialized
                          </TableCell>
                        </TableRow>
                      )
                    }
                    
                    const rowModel = table.getRowModel()
                    if (!rowModel) {
                      return (
                        <TableRow>
                          <TableCell
                            colSpan={columns.length}
                            className="h-24 text-center"
                          >
                            Row model not available
                          </TableCell>
                        </TableRow>
                      )
                    }
                    
                    const rows = rowModel.rows
                    
                    if (loading) {
                      // Show loading skeletons
                      return Array.from({ length: pagination.limit }).map((_, index) => (
                        <TableRowSkeleton key={index} columns={columns.length} />
                      ))
                    }
                    
                    if (rows && Array.isArray(rows) && rows.length > 0) {
                      return rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && 'selected'}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    }
                    
                    // Fallback for when rows is undefined, null, or empty
                    return (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center"
                        >
                          {emptyStateMessage}
                        </TableCell>
                      </TableRow>
                    )
                  } catch (error) {
                    console.error('Error rendering table body:', error)
                    return (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center text-red-500"
                        >
                          Error rendering table: {error instanceof Error ? error.message : 'Unknown error'}
                        </TableCell>
                      </TableRow>
                    )
                  }
                })()}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <Pagination
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        loading={loading}
      />
    </div>
  )
}

// Export the SortableHeader component for use in column definitions
export { SortableHeader }