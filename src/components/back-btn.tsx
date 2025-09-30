'use client'

import { ArrowLeft } from 'lucide-react'
import { Button } from './ui/button'
import { useRouter } from 'next/navigation'

export default function BackBtn() {
  const router = useRouter()

  return (
    <Button
      className="flex space-x-2"
      variant="ghost"
      onClick={() => router.back()}
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </Button>
  )
}
