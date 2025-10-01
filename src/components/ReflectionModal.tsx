'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

interface ReflectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (reflection: string) => Promise<void>
  onViewTranscript: () => void
  isSubmitting?: boolean
}

export function ReflectionModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onViewTranscript,
  isSubmitting = false 
}: ReflectionModalProps) {
  const [reflection, setReflection] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate reflection
    if (!reflection.trim()) {
      setError('Please share your reflection about the conversation')
      return
    }

    if (reflection.length > 300) {
      setError('Reflection must be 300 characters or less')
      return
    }

    setError('')
    await onSubmit(reflection.trim())
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setReflection('')
      setError('')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className='leading-6'>
            Thinking about the conversation, what&apos;s one thing you remember?
          </DialogTitle>
          <DialogDescription className='leading-6'>
            Maybe something you learned, something you enjoyed, or something you would do differently next time?
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Share your thoughts about the conversation..."
              className="min-h-[100px] resize-none"
              maxLength={300}
              disabled={isSubmitting}
              required
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span className={reflection.length > 300 ? 'text-red-500' : ''}>
                {reflection.length}/300 characters
              </span>
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
          
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={onViewTranscript}
              disabled={isSubmitting}
            >
              See transcript
            </Button>
            <div className="flex space-x-2">
              <Button
                type="submit"
                disabled={isSubmitting || !reflection.trim() || reflection.length > 300}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}