import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth-server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const { data, error } = await authServer.signIn(email, password)

    if (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Authentication failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Signin error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
