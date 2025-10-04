import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth-server'
import { isAdmin } from '../../lib/admin-utils'

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

    // Check admin status directly using the shared utility
    const adminStatus = await isAdmin(user.id)
    
    console.log('Checking admin status for user:', user.id)
    console.log('Admin check result:', adminStatus)
    
    return NextResponse.json({ isAdmin: adminStatus })
  } catch (error) {
    console.error('Admin check API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
