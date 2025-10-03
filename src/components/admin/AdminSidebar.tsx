'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { 
  Users, 
  Calendar, 
  UserCheck, 
  FileText, 
  Shield,
  BarChart3
} from 'lucide-react'

// No props needed as we're using SidebarProvider

interface SidebarItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  children?: SidebarItem[]
}

const sidebarItems: SidebarItem[] = [
  {
    title: 'Overview',
    href: '/admin',
    icon: Shield,
  },
  {
    title: 'User Management',
    href: '/admin/users',
    icon: Users,
    children: [
      {
        title: 'All Users',
        href: '/admin/users',
        icon: Users,
      },
      {
        title: 'User Roles',
        href: '/admin/users/roles',
        icon: UserCheck,
      },
    ],
  },
  {
    title: 'Session Management',
    href: '/admin/sessions',
    icon: Calendar,
    children: [
      {
        title: 'All Sessions',
        href: '/admin/sessions',
        icon: Calendar,
      },
      {
        title: 'Active Sessions',
        href: '/admin/sessions/active',
        icon: Calendar,
      },
    ],
  },
  {
    title: 'Persona Management',
    href: '/admin/personas',
    icon: UserCheck,
    children: [
      {
        title: 'All Personas',
        href: '/admin/personas',
        icon: UserCheck,
      },
      {
        title: 'Create Persona',
        href: '/admin/personas/create',
        icon: UserCheck,
      },
    ],
  },
  {
    title: 'Participation Log',
    href: '/admin/participation',
    icon: FileText,
    children: [
      {
        title: 'All Logs',
        href: '/admin/participation',
        icon: FileText,
      },
      {
        title: 'Analytics',
        href: '/admin/participation/analytics',
        icon: BarChart3,
      },
    ],
  },
]

function SidebarItemComponent({ item, level = 0 }: { item: SidebarItem; level?: number }) {
  const pathname = usePathname()
  const isActive = pathname === item.href

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={item.href}>
          <item.icon className="h-4 w-4" />
          <span className={cn(level > 0 && 'ml-4')}>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function AdminSidebar() {
  return (
    <Sidebar variant="inset" className="border-r">
      <SidebarContent>
        <div className="p-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">Admin Panel</span>
          </div>
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item, index) => (
                <div key={index}>
                  <SidebarItemComponent item={item} />
                  {item.children && (
                    <div className="ml-4 space-y-1">
                      {item.children.map((child, childIndex) => (
                        <SidebarItemComponent 
                          key={childIndex} 
                          item={child} 
                          level={1} 
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
