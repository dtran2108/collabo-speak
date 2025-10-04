'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserPlus, UserPen, Loader } from 'lucide-react'

// Zod schema for form validation
const userFormSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters'),
  ieltsScore: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true
      const num = parseFloat(val)
      return !isNaN(num) && num >= 0 && num <= 9
    }, 'IELTS score must be a number between 0 and 9'),
  role: z.enum(['USER', 'ADMIN'], {
    message: 'Please select a role',
  }),
  // Only required for create mode
  email: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true // Optional for update mode
      return z.string().email().safeParse(val).success
    }, 'Please enter a valid email address'),
  password: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true // Optional for update mode
      return val.length >= 4
    }, 'Password must be at least 4 characters'),
})

type UserFormData = z.infer<typeof userFormSchema>

interface UserFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: UserFormData) => Promise<void>
  isLoading?: boolean
  mode: 'create' | 'update'
  initialData?: {
    fullName?: string
    ieltsScore?: string
    role?: 'USER' | 'ADMIN'
    email?: string
  }
}

export function UserForm({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  mode,
  initialData,
}: UserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      ieltsScore: '',
      role: 'USER',
    },
  })

  const selectedRole = watch('role')

  // Reset form when modal opens/closes or when initialData changes
  React.useEffect(() => {
    if (isOpen) {
      reset({
        email: mode === 'create' ? '' : initialData?.email || '',
        password: mode === 'create' ? '' : '',
        fullName: initialData?.fullName || '',
        ieltsScore: initialData?.ieltsScore || '',
        role: initialData?.role || 'USER',
      })
    }
  }, [isOpen, reset, mode, initialData])

  const handleFormSubmit = async (data: UserFormData) => {
    try {
      await onSubmit(data)
      reset()
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Form submission error:', error)
    }
  }

  const handleClose = () => {
    if (!isSubmitting && !isLoading) {
      reset()
      onClose()
    }
  }

  const isCreateMode = mode === 'create'
  const title = isCreateMode ? 'Add New User' : 'Update User'
  const description = isCreateMode
    ? 'Create a new user account with email auto-confirmation. The user will be able to log in immediately with the provided password.'
    : ''
  const submitText = isCreateMode ? 'Create User' : 'Update User'
  const submitLoadingText = isCreateMode
    ? 'Creating User...'
    : 'Updating User...'
  const icon = isCreateMode ? UserPlus : UserPen

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${
                isCreateMode
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-orange-100 text-orange-600'
              }`}
            >
              {React.createElement(icon, { className: 'h-5 w-5' })}
            </div>
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Email field - only show in create mode */}
          {isCreateMode && (
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                {...register('email')}
                disabled={isSubmitting || isLoading}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
          )}

          {/* Password field - only show in create mode */}
          {isCreateMode && (
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                {...register('password')}
                disabled={isSubmitting || isLoading}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>
          )}

          {/* Full Name field - always shown */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              {...register('fullName')}
              disabled={isSubmitting || isLoading}
              className={errors.fullName ? 'border-red-500' : ''}
            />
            {errors.fullName && (
              <p className="text-sm text-red-500">{errors.fullName.message}</p>
            )}
          </div>

          {/* IELTS Score field - always shown */}
          <div className="space-y-2">
            <Label htmlFor="ieltsScore">IELTS Score (Optional)</Label>
            <Input
              id="ieltsScore"
              type="number"
              step="0.5"
              min="0"
              max="9"
              placeholder="7.5"
              {...register('ieltsScore')}
              disabled={isSubmitting || isLoading}
              className={errors.ieltsScore ? 'border-red-500' : ''}
            />
            {errors.ieltsScore && (
              <p className="text-sm text-red-500">
                {errors.ieltsScore.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter a score between 0 and 9 (e.g., 7.5)
            </p>
          </div>

          {/* Role field - always shown */}
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) =>
                setValue('role', value as 'USER' | 'ADMIN')
              }
              disabled={isSubmitting || isLoading}
            >
              <SelectTrigger
                className={errors.role ? 'border-red-500 w-full' : 'w-full'}
              >
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">USER</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-500">{errors.role.message}</p>
            )}
          </div>

          <DialogFooter className="space-x-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="flex-1"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  {submitLoadingText}
                </>
              ) : (
                submitText
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
