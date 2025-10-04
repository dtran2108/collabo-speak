import React from 'react'
import { 
  Shield, 
  Users, 
  UserCheck, 
  Calendar, 
  FileText, 
  BarChart3, 
  Bot,
  MessagesSquare
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
    title: 'All Sessions',
    href: '/admin/sessions',
    icon: MessagesSquare,
  },
  {
    title: 'All Personas',
    href: '/admin/personas',
    icon: Bot,
  },
  {
    title: 'All Participation Logs',
    href: '/admin/participation',
    icon: FileText,
  },
]
