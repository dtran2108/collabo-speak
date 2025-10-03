'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useAdmin } from '@/hooks/useAdmin'
import { useRouter } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { 
  SidebarProvider, 
  SidebarInset,
  SidebarTrigger
} from '@/components/ui/sidebar'
import { Loader2 } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const { isAdmin: isAdminUser, loading: adminLoading } = useAdmin()
  const router = useRouter()

  // Show loading state
  if (loading || adminLoading) {
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
        <header className="bg-background border-b px-4 py-3 flex items-center gap-4">
          <SidebarTrigger className="lg:hidden" />
          <h1 className="text-lg font-semibold">Admin Dashboard</h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
