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
import { UserPlus, Loader2 } from 'lucide-react'

// Zod schema for form validation
const addUserSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(4, 'Password must be at least 4 characters'),
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters'),
  ieltsScore: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true
        const num = parseFloat(val)
        return !isNaN(num) && num >= 0 && num <= 9
      },
      'IELTS score must be a number between 0 and 9'
    ),
  role: z.enum(['USER', 'ADMIN'], {
    message: 'Please select a role',
  }),
})

type AddUserFormData = z.infer<typeof addUserSchema>

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AddUserFormData) => Promise<void>
  isLoading?: boolean
}

export function AddUserModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: AddUserModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      ieltsScore: '',
      role: 'USER',
    },
  })

  const selectedRole = watch('role')

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      reset({
        email: '',
        password: '',
        fullName: '',
        ieltsScore: '',
        role: 'USER',
      })
    }
  }, [isOpen, reset])

  const handleFormSubmit = async (data: AddUserFormData) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100 text-blue-600">
              <UserPlus className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-semibold">
              Add New User
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            Create a new user account with email auto-confirmation. The user will
            be able to log in immediately with the provided password.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
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
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

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
              <p className="text-sm text-red-500">{errors.ieltsScore.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter a score between 0 and 9 (e.g., 7.5)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setValue('role', value as 'USER' | 'ADMIN')}
              disabled={isSubmitting || isLoading}
            >
              <SelectTrigger className={errors.role ? 'border-red-500 w-full' : 'w-full'}>
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
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating User...
                </>
              ) : (
                'Create User'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
