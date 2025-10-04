import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    // Get user from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const user = await authServer.getCurrentUser(token)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Call the roles API to get all user info
    const rolesResponse = await fetch(`${request.nextUrl.origin}/api/roles`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!rolesResponse.ok) {
      console.error('Roles API error:', rolesResponse.status, rolesResponse.statusText)
      return NextResponse.json(
        { error: 'Failed to get user roles' },
        { status: 500 }
      )
    }

    const rolesData = await rolesResponse.json()

    return NextResponse.json({ 
      userId: user.id,
      userEmail: user.email,
      ...rolesData
    })
  } catch (error) {
    console.error('Debug admin API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
