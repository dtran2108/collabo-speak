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

export interface FilterConfig {
  id: string
  label: string
  placeholder?: string
  type: 'select' | 'text' | 'date' | 'number'
  options?: FilterOption[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  width?: string
}
