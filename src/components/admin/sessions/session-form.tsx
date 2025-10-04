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
import { Textarea } from '@/components/ui/textarea'
import { Calendar, CalendarPlus, Loader } from 'lucide-react'

// Zod schema for form validation
const sessionFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .min(5, 'Description must be at least 5 characters')
    .max(500, 'Description must be less than 500 characters'),
  agentId: z
    .string()
    .min(1, 'Agent ID is required')
    .max(50, 'Agent ID must be less than 50 characters'),
  isReady: z.boolean(),
})

type SessionFormData = z.infer<typeof sessionFormSchema>

interface SessionFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: SessionFormData) => Promise<void>
  isLoading?: boolean
  mode: 'create' | 'update'
  initialData?: {
    name?: string
    description?: string
    agentId?: string
    isReady?: boolean
  }
}

export function SessionForm({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  mode,
  initialData,
}: SessionFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<SessionFormData>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      name: '',
      description: '',
      agentId: '',
      isReady: false,
    },
  })

  const isReadyValue = watch('isReady')

  // Reset form when modal opens/closes or when initialData changes
  React.useEffect(() => {
    if (isOpen) {
      reset({
        name: initialData?.name || '',
        description: initialData?.description || '',
        agentId: initialData?.agentId || '',
        isReady: initialData?.isReady || false,
      })
    }
  }, [isOpen, reset, mode, initialData])

  const handleFormSubmit = async (data: SessionFormData) => {
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
  const title = isCreateMode ? 'Add New Session' : 'Update Session'
  const description = isCreateMode
    ? 'Create a new collaborative session with an AI agent.'
    : 'Update the session details and configuration.'
  const submitText = isCreateMode ? 'Create Session' : 'Update Session'
  const submitLoadingText = isCreateMode
    ? 'Creating Session...'
    : 'Updating Session...'
  const icon = isCreateMode ? CalendarPlus : Calendar

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
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
          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="name">Session Name *</Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., English Conversation Practice"
              {...register('name')}
              disabled={isSubmitting || isLoading}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Description field */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the purpose and goals of this session..."
              rows={3}
              {...register('description')}
              disabled={isSubmitting || isLoading}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Agent ID field */}
          <div className="space-y-2">
            <Label htmlFor="agentId">Agent ID *</Label>
            <Input
              id="agentId"
              type="text"
              placeholder="e.g., agent-001, english-tutor, etc."
              {...register('agentId')}
              disabled={isSubmitting || isLoading}
              className={errors.agentId ? 'border-red-500' : ''}
            />
            {errors.agentId && (
              <p className="text-sm text-red-500">{errors.agentId.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Unique identifier for the AI agent that will handle this session
            </p>
          </div>

          {/* Is Ready field */}
          <div className="space-y-2">
            <Label htmlFor="isReady">Session Status</Label>
            <div className="flex items-center space-x-2">
              <input
                id="isReady"
                type="checkbox"
                checked={isReadyValue}
                onChange={(e) => setValue('isReady', e.target.checked)}
                disabled={isSubmitting || isLoading}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <Label htmlFor="isReady" className="text-sm font-normal">
                Mark as ready for use
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Only ready sessions can be used by participants
            </p>
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
