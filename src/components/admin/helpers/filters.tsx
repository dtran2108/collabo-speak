import React from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FilterConfig } from './types'

interface DynamicFilterProps {
  filter: FilterConfig
}

export function DynamicFilter({ filter }: DynamicFilterProps) {
  const { label, placeholder, type, options = [], value, onChange, disabled = false, width = "w-full sm:w-48" } = filter

  const renderFilter = () => {
    switch (type) {
      case 'select':
        return (
          <Select
            value={value || "all"}
            onValueChange={onChange}
            disabled={disabled}
          >
            <SelectTrigger className={width}>
              <SelectValue placeholder={placeholder || `Filter by ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {label}</SelectItem>
              {options.map((option) => (
                <SelectItem key={option.id} value={option.name}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      
      case 'text':
        return (
          <Input
            placeholder={placeholder || `Filter by ${label.toLowerCase()}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={width}
            disabled={disabled}
          />
        )
      
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={width}
            disabled={disabled}
          />
        )
      
      case 'number':
        return (
          <Input
            type="number"
            placeholder={placeholder || `Filter by ${label.toLowerCase()}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={width}
            disabled={disabled}
          />
        )
      
      default:
        return null
    }
  }

  return (
    <div className={width}>
      {renderFilter()}
    </div>
  )
}

interface FiltersContainerProps {
  filters: FilterConfig[]
}

export function FiltersContainer({ filters }: FiltersContainerProps) {
  return (
    <>
      {filters.map((filter) => (
        <DynamicFilter key={filter.id} filter={filter} />
      ))}
    </>
  )
}
