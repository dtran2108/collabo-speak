'use client'

import React from 'react'
import { SessionForm } from './session-form'

// Type for the form data
export interface AddSessionFormData {
  name: string
  description: string
  agentId: string
  isReady: boolean
}

interface AddSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AddSessionFormData) => Promise<void>
  isLoading?: boolean
}

export function AddSessionModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: AddSessionModalProps) {
  const handleSubmit = async (data: {
    name: string
    description: string
    agentId: string
    isReady: boolean
  }) => {
    await onSubmit({
      name: data.name,
      description: data.description,
      agentId: data.agentId,
      isReady: data.isReady,
    })
  }

  return (
    <SessionForm
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      mode="create"
    />
  )
}
