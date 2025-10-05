'use client'

import React from 'react'
import { PersonaForm } from './persona-form'

// Type for the form data
export interface AddPersonaFormData {
  name: string
  description: string
  sessionId: string
  avatarUrl?: string
}

interface AddPersonaModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AddPersonaFormData) => Promise<void>
  isLoading?: boolean
}

export function AddPersonaModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: AddPersonaModalProps) {
  const handleSubmit = async (data: {
    name: string
    description: string
    sessionId: string
    avatarUrl?: string
  }) => {
    await onSubmit({
      name: data.name,
      description: data.description,
      sessionId: data.sessionId,
      avatarUrl: data.avatarUrl || '',
    })
  }

  return (
    <PersonaForm
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      mode="create"
    />
  )
}
