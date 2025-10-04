'use client'

import React from 'react'
import { UserForm } from './user-form'

// Type for the form data
export interface AddUserFormData {
  email: string
  password: string
  fullName: string
  ieltsScore?: string
  role: 'USER' | 'ADMIN'
}

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
  const handleSubmit = async (data: {
    fullName: string
    role: 'USER' | 'ADMIN'
    ieltsScore?: string
    email?: string
    password?: string
  }) => {
    // Ensure email and password are present for create mode
    if (!data.email || !data.password) {
      throw new Error('Email and password are required for creating a user')
    }
    
    await onSubmit({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      ieltsScore: data.ieltsScore,
      role: data.role,
    })
  }

  return (
    <UserForm
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      mode="create"
    />
  )
}
