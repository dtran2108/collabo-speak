'use client'

import React from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { TableRowSkeleton } from '@/components/ui/table-skeleton'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
} from 'lucide-react'

// Generic types for the data table
export interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface FilterOption {
  id: string
  name: string
}

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
  
  // Role filtering (optional)
  roleFilter?: string
  onRoleFilterChange?: (value: string) => void
  availableRoles?: FilterOption[]
  
  // Actions
  onAddItem?: () => void
  addButtonText?: string
  
  // Custom empty state
  emptyStateMessage?: string
}

// Sortable header component
const SortableHeader = ({ column, children }: { column: { getCanSort: () => boolean; toggleSorting: (asc: boolean) => void; getIsSorted: () => false | 'asc' | 'desc' }; children: React.ReactNode }) => {
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
  roleFilter,
  onRoleFilterChange,
  availableRoles = [],
  onAddItem,
  addButtonText = "Add Item",
  emptyStateMessage = "No data found."
}: AdminDataTableProps<TData>) {
  console.log("DEBUG ~ AdminDataTable ~ data:", data)
  
  // Table configuration
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
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
    pageCount: pagination.totalPages,
  })

  // Debug logging
  React.useEffect(() => {
    console.log('AdminDataTable - Table state:', {
      table: !!table,
      hasGetRowModel: table && typeof table.getRowModel === 'function',
      dataLength: data?.length || 0,
      loading,
      error
    })
  }, [table, data, loading, error])

  const handlePageChange = (newPage: number) => {
    onPaginationChange({
      ...pagination,
      page: newPage
    })
  }

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
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>
        </div>
        
        {onRoleFilterChange && availableRoles.length > 0 && (
          <div className="w-full sm:w-48">
            <Select
              value={roleFilter || "all"}
              onValueChange={onRoleFilterChange}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {availableRoles.map((role) => (
                  <SelectItem key={role.id} value={role.name}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
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
    </div>
  )
}

// Export the SortableHeader component for use in column definitions
export { SortableHeader }
