import React from 'react'
import { 
  Shield, 
  Users, 
  UserCheck, 
  Calendar, 
  FileText, 
  BarChart3 
} from 'lucide-react'

export interface AdminNavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export const adminNavItems: AdminNavItem[] = [
  {
    title: 'Overview',
    href: '/admin',
    icon: Shield,
  },
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
  {
    title: 'All Sessions',
    href: '/admin/sessions',
    icon: Calendar,
  },
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
]
