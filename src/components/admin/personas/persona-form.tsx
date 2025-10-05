'use client'

import React, { useState, useEffect } from 'react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User, UserPlus, Loader } from 'lucide-react'

// Zod schema for form validation
const personaFormSchema = z.object({
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
  sessionId: z
    .string()
    .min(1, 'Session is required'),
  avatarUrl: z
    .string()
    .url('Avatar URL must be a valid URL')
    .optional()
    .or(z.literal('')),
})

type PersonaFormData = z.infer<typeof personaFormSchema>

interface Session {
  id: string
  name: string
}

interface PersonaFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PersonaFormData) => Promise<void>
  isLoading?: boolean
  mode: 'create' | 'update'
  initialData?: {
    name?: string
    description?: string
    sessionId?: string
    avatarUrl?: string
  }
}

export function PersonaForm({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  mode,
  initialData,
}: PersonaFormProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<PersonaFormData>({
    resolver: zodResolver(personaFormSchema),
    defaultValues: {
      name: '',
      description: '',
      sessionId: '',
      avatarUrl: '',
    },
  })

  const sessionIdValue = watch('sessionId')

  // Fetch sessions when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSessions()
    }
  }, [isOpen])

  // Reset form when modal opens/closes or when initialData changes
  useEffect(() => {
    if (isOpen) {
      reset({
        name: initialData?.name || '',
        description: initialData?.description || '',
        sessionId: initialData?.sessionId || '',
        avatarUrl: initialData?.avatarUrl || '',
      })
    }
  }, [isOpen, reset, mode, initialData])

  const fetchSessions = async () => {
    try {
      setSessionsLoading(true)
      
      // Get auth token
      const { authClient } = await import('@/lib/auth-client')
      const {
        data: { session },
      } = await authClient.getSession()

      if (!session?.access_token) {
        throw new Error('No valid session found')
      }

      const response = await fetch('/api/admin/sessions?limit=1000', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      } else {
        console.error('Failed to fetch sessions:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setSessionsLoading(false)
    }
  }

  const handleFormSubmit = async (data: PersonaFormData) => {
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
  const title = isCreateMode ? 'Add New Persona' : 'Update Persona'
  const description = isCreateMode
    ? 'Create a new persona for collaborative sessions.'
    : 'Update the persona details and configuration.'
  const submitText = isCreateMode ? 'Create Persona' : 'Update Persona'
  const submitLoadingText = isCreateMode
    ? 'Creating Persona...'
    : 'Updating Persona...'
  const icon = isCreateMode ? UserPlus : User

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
            <Label htmlFor="name">Persona Name *</Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., English Tutor, Business Coach"
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
              placeholder="Describe the persona's role, personality, and expertise..."
              rows={3}
              {...register('description')}
              disabled={isSubmitting || isLoading}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Session field */}
          <div className="space-y-2">
            <Label htmlFor="sessionId">Session *</Label>
            <Select
              value={sessionIdValue}
              onValueChange={(value) => setValue('sessionId', value)}
              disabled={isSubmitting || isLoading || sessionsLoading}
            >
              <SelectTrigger className={`w-full ${errors.sessionId ? 'border-red-500' : ''}`}>
                <SelectValue placeholder={sessionsLoading ? "Loading sessions..." : "Select a session"} />
              </SelectTrigger>
              <SelectContent>
                {sessionsLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading sessions...
                  </SelectItem>
                ) : sessions.length === 0 ? (
                  <SelectItem value="no-sessions" disabled>
                    No sessions available
                  </SelectItem>
                ) : (
                  sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.sessionId && (
              <p className="text-sm text-red-500">{errors.sessionId.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Choose which session this persona belongs to
            </p>
          </div>

          {/* Avatar URL field */}
          <div className="space-y-2">
            <Label htmlFor="avatarUrl">Avatar URL</Label>
            <Input
              id="avatarUrl"
              type="url"
              placeholder="https://example.com/avatar.jpg"
              {...register('avatarUrl')}
              disabled={isSubmitting || isLoading}
              className={errors.avatarUrl ? 'border-red-500' : ''}
            />
            {errors.avatarUrl && (
              <p className="text-sm text-red-500">{errors.avatarUrl.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Optional: URL to an image for this persona&apos;s avatar
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
