import { useState, useEffect, useCallback, useMemo } from 'react'
import { SortingState } from '@tanstack/react-table'
import { PaginationState } from '@/components/admin/AdminDataTable'
import { useDebounce } from './useDebounce'

export interface UseAdminTableProps<TData = unknown> {
  // API configuration
  fetchData: (params: {
    page: number
    limit: number
    search: string
    sortBy: string
    sortOrder: 'asc' | 'desc'
    roleId?: string
  }) => Promise<{
    data: TData[]
    pagination: PaginationState
  }>
  
  // Initial state
  initialPage?: number
  initialLimit?: number
  initialSearch?: string
  initialSorting?: SortingState
}

export function useAdminTable<TData = unknown>({
  fetchData,
  initialPage = 1,
  initialLimit = 10,
  initialSearch = '',
  initialSorting = []
}: UseAdminTableProps<TData>) {
  // State management
  const [data, setData] = useState<TData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0
  })
  
  // Sorting state
  const [sorting, setSorting] = useState<SortingState>(initialSorting)
  
  // Search state
  const [search, setSearch] = useState(initialSearch)
  
  // Debounced search to prevent too many API calls
  const debouncedSearch = useDebounce(search, 500)
  
  // Role filter state
  const [roleFilter, setRoleFilter] = useState<string>('all')
  
  // Fetch data function
  const loadData = useCallback(async () => {
    console.log('DEBUG ~ useAdminTable ~ loadData called')
    try {
      setLoading(true)
      setError(null)
      console.log('DEBUG ~ useAdminTable ~ setLoading(true)')
      
      const sortBy = sorting[0]?.id || 'created_at'
      const sortOrder = sorting[0]?.desc ? 'desc' : 'asc'
      
      const result = await fetchData({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch,
        sortBy,
        sortOrder,
        roleId: roleFilter !== 'all' ? roleFilter : undefined
      })
      
      console.log('DEBUG ~ useAdminTable ~ fetchData result:', result)
      console.log('DEBUG ~ useAdminTable ~ result.data:', result.data)
      console.log('DEBUG ~ useAdminTable ~ result.pagination:', result.pagination)
      
      setData(result.data)
      setPagination(result.pagination)
      console.log('DEBUG ~ useAdminTable ~ data set successfully')
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
      console.log('DEBUG ~ useAdminTable ~ setLoading(false)')
    }
  }, [fetchData, pagination.page, pagination.limit, debouncedSearch, sorting, roleFilter])
  
  // Load data when dependencies change
  useEffect(() => {
    loadData()
  }, [loadData])
  
  // Handlers
  const handlePaginationChange = useCallback((newPagination: PaginationState) => {
    setPagination(newPagination)
  }, [])
  
  const handleSortingChange = useCallback((newSorting: SortingState) => {
    setSorting(newSorting)
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page when sorting
  }, [])
  
  const handleSearchChange = useCallback((newSearch: string) => {
    setSearch(newSearch)
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page when searching
  }, [])
  
  const handleRoleFilterChange = useCallback((newRoleFilter: string) => {
    setRoleFilter(newRoleFilter)
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page when filtering
  }, [])
  
  // Computed values
  const sortBy = useMemo(() => sorting[0]?.id || 'created_at', [sorting])
  const sortOrder = useMemo(() => sorting[0]?.desc ? 'desc' : 'asc', [sorting])
  
  return {
    // Data
    data,
    loading,
    error,
    
    // State
    pagination,
    sorting,
    search,
    roleFilter,
    
    // Handlers
    handlePaginationChange,
    handleSortingChange,
    handleSearchChange,
    handleRoleFilterChange,
    
    // Computed
    sortBy,
    sortOrder,
    
    // Actions
    refetch: loadData
  }
}
