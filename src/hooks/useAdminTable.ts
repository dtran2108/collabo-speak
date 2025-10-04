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
    [key: string]: unknown // Allow any additional filter parameters
  }) => Promise<{
    data: TData[]
    pagination: PaginationState
  }>
  
  // Filter configuration
  filterKey?: string // The key name for the filter parameter (e.g., 'roleId', 'isReady')
  filterValue?: string // The current filter value
  
  // Initial state
  initialPage?: number
  initialLimit?: number
  initialSearch?: string
  initialSorting?: SortingState
}

export function useAdminTable<TData = unknown>({
  fetchData,
  filterKey = 'roleId', // Default to 'roleId' for backward compatibility
  filterValue,
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
  
  // Filter state - use internal state if no external filterValue provided
  const [internalFilter, setInternalFilter] = useState<string>('all')
  const currentFilter = filterValue !== undefined ? filterValue : internalFilter
  
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
      const sortOrder: 'asc' | 'desc' = sorting[0]?.desc ? 'desc' : 'asc'
      
      // Build parameters object with filter
      const params: {
        page: number
        limit: number
        search: string
        sortBy: string
        sortOrder: 'asc' | 'desc'
        [key: string]: unknown
      } = {
        page: paginationRef.current.page,
        limit: paginationRef.current.limit,
        search: debouncedSearch,
        sortBy,
        sortOrder,
        ...(currentFilter !== 'all' && filterKey ? { [filterKey]: currentFilter } : {}),
      }
      
      const result = await fetchData(params)
      
      setData(result.data)
      setPagination(result.pagination)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [fetchData, debouncedSearch, sorting, currentFilter, filterKey])
  
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
  
  const handleFilterChange = useCallback((newFilter: string) => {
    if (filterValue === undefined) {
      // Only update internal state if no external filterValue is provided
      setInternalFilter(newFilter)
    }
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page when filtering
  }, [filterValue])
  
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
    filter: currentFilter,
    
    // Handlers
    handlePaginationChange,
    handleSortingChange,
    handleSearchChange,
    handleFilterChange,
    
    // Computed
    sortBy,
    sortOrder,
    
    // Actions
    refetch: loadData
  }
}
