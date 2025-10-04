'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { TableRowSkeleton } from '@/components/ui/table-skeleton'
import { useDebounce } from '@/hooks/useDebounce'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  getPaginationRowModel,
  ColumnFiltersState,
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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'

interface User {
  userId: string
  displayName: string
  email: string
  ieltsScore: string
  sessionParticipationCount: number
  roles: string[]
  createdAt: string
}

interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function AdminUsersPage() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  // Debounced search value (500ms delay)
  const debouncedSearchValue = useDebounce(globalFilter, 500)

  // Available roles for filtering
  const [availableRoles, setAvailableRoles] = useState<
    { id: string; name: string }[]
  >([])

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (!loading && user && !isAdmin) {
      router.push('/')
      return
    }
  }, [user, loading, isAdmin, router])

  // Fetch users data
  const fetchUsers = useCallback(async () => {
    if (!user) return

    try {
      setUsersLoading(true)
      setError(null)

      const {
        data: { session },
      } = await authClient.getSession()
      if (!session?.access_token) {
        throw new Error('No valid session found')
      }

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: debouncedSearchValue,
        sortBy: sorting[0]?.id || 'created_at',
        sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
      })

      // Only add role filter if it's not "all"
      if (roleFilter && roleFilter !== 'all') {
        const selectedRole = availableRoles.find(
          (role) => role.name === roleFilter,
        )
        if (selectedRole) {
          params.set('roleId', selectedRole.id)
        }
      }

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. Admin privileges required.')
        }
        throw new Error('Failed to fetch users')
      }

      const data: UsersResponse = await response.json()
      setUsers(data.users)
      setPagination(data.pagination)

      // Fetch available roles from API
      const rolesResponse = await fetch('/api/roles/all', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json()
        const roles =
          rolesData.roles?.map((role: { id: string; name: string }) => ({
            id: role.id,
            name: role.name,
          })) || []
        setAvailableRoles(roles)
      } else {
        // Fallback to hardcoded roles if API fails
        setAvailableRoles([
          { id: 'admin-id', name: 'ADMIN' },
          { id: 'user-id', name: 'USER' },
        ])
      }
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setUsersLoading(false)
    }
  }, [
    user,
    pagination.page,
    pagination.limit,
    debouncedSearchValue,
    roleFilter,
    sorting,
  ])

  // Fetch users when dependencies change
  useEffect(() => {
    if (user && isAdmin) {
      fetchUsers()
    }
  }, [
    user,
    isAdmin,
    pagination.page,
    pagination.limit,
    debouncedSearchValue,
    roleFilter,
    sorting,
    fetchUsers,
  ])

  // Table columns definition
  const columns: ColumnDef<User>[] = useMemo(
    () => [
      {
        accessorKey: 'userId',
        header: ({ column }) => (
          <SortableHeader column={column}>
            User ID
          </SortableHeader>
        ),
        size: 200,
        cell: ({ row }) => (
          <div className="font-mono text-sm whitespace-nowrap">
            {row.getValue('userId') as string}
          </div>
        ),
      },
      {
        accessorKey: 'displayName',
        header: ({ column }) => (
          <SortableHeader column={column}>
            Display Name
          </SortableHeader>
        ),
        size: 150,
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue('displayName')}</div>
        ),
      },
      {
        accessorKey: 'email',
        header: ({ column }) => (
          <SortableHeader column={column}>
            Email
          </SortableHeader>
        ),
        size: 200,
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {row.getValue('email')}
          </div>
        ),
      },
      {
        accessorKey: 'ieltsScore',
        header: ({ column }) => (
          <SortableHeader column={column}>
            IELTS Score
          </SortableHeader>
        ),
        size: 100,
        cell: ({ row }) => (
          <div className="text-center">{row.getValue('ieltsScore')}</div>
        ),
      },
      {
        accessorKey: 'sessionParticipationCount',
        header: ({ column }) => (
          <SortableHeader column={column}>
            Sessions
          </SortableHeader>
        ),
        size: 100,
        cell: ({ row }) => (
          <div className="text-center font-medium">
            {row.getValue('sessionParticipationCount')}
          </div>
        ),
      },
      {
        accessorKey: 'roles',
        header: ({ column }) => (
          <SortableHeader column={column}>
            Roles
          </SortableHeader>
        ),
        enableSorting: false,
        size: 150,
        cell: ({ row }) => {
          const roles = row.getValue('roles') as string[]
          return (
            <div className="flex flex-wrap gap-1">
              {roles.length > 0 ? (
                roles.map((role) => (
                  <Badge
                    key={role}
                    variant={role === 'ADMIN' ? 'destructive' : 'secondary'}
                    className={`text-xs ${
                      role === 'ADMIN'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-blue-100 text-blue-800 border-blue-200'
                    }`}
                  >
                    {role}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">No roles</span>
              )}
            </div>
          )
        },
      },
      {
        id: 'actions',
        header: ({ column }) => (
          <SortableHeader column={column}>
            Actions
          </SortableHeader>
        ),
        enableSorting: false,
        size: 150,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditUser(row.original.userId)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteUser(row.original.userId)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  // Table configuration
  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    manualPagination: true,
    pageCount: pagination.totalPages,
  })

  // Event handlers
  const handleAddUser = () => {
    // TODO: Implement add user functionality
    console.log('Add user clicked')
  }

  const handleEditUser = (userId: string) => {
    // TODO: Implement edit user functionality
    console.log('Edit user:', userId)
  }

  const handleDeleteUser = (userId: string) => {
    // TODO: Implement delete user functionality
    console.log('Delete user:', userId)
  }

  const handleSearch = (value: string) => {
    setGlobalFilter(value)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleRoleFilter = (value: string) => {
    setRoleFilter(value)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  // Sortable header component
  const SortableHeader = ({ column, children }: { column: any; children: React.ReactNode }) => {
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

  // Only show page-level loading for auth, not for data fetching
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchUsers} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name or email..."
              value={globalFilter}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
              disabled={usersLoading}
            />
            {globalFilter !== debouncedSearchValue && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={roleFilter}
            onValueChange={handleRoleFilter}
            disabled={usersLoading}
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
        <Button onClick={handleAddUser} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
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
                ))}
              </TableHeader>
              <TableBody>
                {usersLoading ? (
                  // Show loading skeletons
                  Array.from({ length: pagination.limit }).map((_, index) => (
                    <TableRowSkeleton key={index} columns={columns.length} />
                  ))
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
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
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
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
              of {pagination.total} users
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((prev) => ({ ...prev, page: 1 }))}
                disabled={pagination.page === 1 || usersLoading}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                disabled={pagination.page === 1 || usersLoading}
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
                      setPagination((prev) => ({ ...prev, page }))
                    }
                  }}
                  className="w-16 h-8"
                  disabled={usersLoading}
                />
                <span className="text-sm">of {pagination.totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={
                  pagination.page === pagination.totalPages || usersLoading
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: pagination.totalPages,
                  }))
                }
                disabled={
                  pagination.page === pagination.totalPages || usersLoading
                }
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
