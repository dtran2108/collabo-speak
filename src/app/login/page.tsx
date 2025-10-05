'use client'

import { LoginForm } from '@/components/auth/LoginForm'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import TextPressure from '@/components/TextPressure'
import { PageLoading } from '@/components/ui/loading-spinner'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return <PageLoading />
  }

  if (user) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 -mt-16">
      <div className="max-w-md w-full flex-1 flex flex-col justify-center! space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-center">Welcome to</h1>
          <TextPressure
            text="CollaboSpeak"
            flex={false}
            alpha={false}
            stroke={false}
            width={false}
            weight={true}
            italic={true}
            textColor="#000000"
            strokeColor="#ff0000"
            minFontSize={36}
          />
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
