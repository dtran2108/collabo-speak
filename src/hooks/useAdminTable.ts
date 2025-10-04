import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { SortingState } from '@tanstack/react-table'
import { PaginationState } from '@/components/admin/helpers'
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
  
  // Use refs to track current pagination values to avoid circular dependencies
  const paginationRef = useRef(pagination)
  paginationRef.current = pagination
  
  // Field mapping function to convert frontend field names to API field names
  const mapSortField = (frontendField: string): string => {
    const fieldMap: Record<string, string> = {
      'createdAt': 'created_at',
      'displayName': 'full_name', 
      'email': 'email',
      'ieltsScore': 'ielts_score',
      'sessionParticipationCount': 'session_participation_count'
    }
    return fieldMap[frontendField] || frontendField
  }

  // Fetch data function
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const frontendSortBy = sorting[0]?.id || 'createdAt'
      const sortBy = mapSortField(frontendSortBy)
      const sortOrder = sorting[0]?.desc ? 'desc' : 'asc'
      
      const result = await fetchData({
        page: paginationRef.current.page,
        limit: paginationRef.current.limit,
        search: debouncedSearch,
        sortBy,
        sortOrder,
        roleId: roleFilter !== 'all' ? roleFilter : undefined
      })
      
      setData(result.data)
      setPagination(result.pagination)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [fetchData, debouncedSearch, sorting, roleFilter])
  
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
  const sortBy = useMemo(() => {
    const frontendField = sorting[0]?.id || 'createdAt'
    return mapSortField(frontendField)
  }, [sorting])
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
