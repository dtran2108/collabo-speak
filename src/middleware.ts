import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/app/api/lib/supabase'
import { isAdmin } from '@/lib/roles'

export async function middleware(request: NextRequest) {
  // Check if the route is an admin route
  if (request.nextUrl.pathname.startsWith('/admin')) {
    try {
      // Get the authorization header (for API calls)
      const authHeader = request.headers.get('authorization')

      // For client-side navigation, we'll let the page handle the auth check
      // The middleware will only block if there's an explicit auth header that fails
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '')
        const {
          data: { user },
          error: userError,
        } = await supabaseAdmin.auth.getUser(token)

        if (userError || !user) {
          return NextResponse.redirect(new URL('/login', request.url))
        }

        // Check if user has admin role
        const adminCheck = await isAdmin(user.id)

        if (!adminCheck) {
          return NextResponse.redirect(new URL('/', request.url))
        }
      }

      // Allow the request to proceed - the admin page will handle auth checking
      return NextResponse.next()
    } catch (error) {
      console.error('Admin middleware error:', error)
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
