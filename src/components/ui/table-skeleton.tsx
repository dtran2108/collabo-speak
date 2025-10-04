import { TableRow, TableCell } from '@/components/ui/table'

// Loading skeleton component for table cells
export const TableCellSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
  </div>
)

// Loading skeleton for table rows
export const TableRowSkeleton = ({ columns }: { columns: number }) => (
  <TableRow>
    {Array.from({ length: columns }).map((_, index) => (
      <TableCell key={index}>
        <TableCellSkeleton />
      </TableCell>
    ))}
  </TableRow>
)

// Loading skeleton for entire table
export const TableSkeleton = ({ 
  columns, 
  rows = 5 
}: { 
  columns: number
  rows?: number 
}) => (
  <>
    {Array.from({ length: rows }).map((_, index) => (
      <TableRowSkeleton key={index} columns={columns} />
    ))}
  </>
)
