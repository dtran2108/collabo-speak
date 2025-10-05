import React from 'react'
import { 
  Shield, 
  Users, 
  FileText, 
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
    title: 'Manage Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Manage Sessions',
    href: '/admin/sessions',
    icon: MessagesSquare,
  },
  {
    title: 'Manage Agents',
    href: '/admin/agents',
    icon: Bot,
  },
  {
    title: 'Participation Logs',
    href: '/admin/participation-log',
    icon: FileText,
  },
]
