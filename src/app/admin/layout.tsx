'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { 
  SidebarProvider, 
  SidebarInset,
  SidebarTrigger
} from '@/components/ui/sidebar'
import { Loader2 } from 'lucide-react'

// Function to get page title based on pathname
function getPageTitle(pathname: string): string {
  const pathSegments = pathname.split('/').filter(Boolean)
  
  if (pathSegments.length <= 1) {
    return 'Admin Dashboard'
  }
  
  const page = pathSegments[1]
  
  switch (page) {
    case 'users':
      return 'User Management'
    case 'sessions':
      return 'Session Management'
    case 'personas':
      return 'Persona Management'
    case 'participation':
      return 'Participation Log'
    default:
      return 'Admin Dashboard'
  }
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, isAdmin: isAdminUser } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (!user) {
    router.push('/login')
    return null
  }

  // Redirect if not admin
  if (!isAdminUser) {
    router.push('/dashboard')
    return null
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        {/* Top bar */}
        <header className="bg-background border-b px-4 py-2 flex items-center gap-4">
          <SidebarTrigger className="lg:hidden" />
          <h1 className="text-lg font-semibold">{pageTitle}</h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-2">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
