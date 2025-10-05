'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Users,
  AlertTriangle,
  Activity,
  Target,
  Brain,
  MessageSquare,
  Star,
} from 'lucide-react'
import { PageLoading } from '@/components/ui/loading-spinner'

interface AdminStats {
  totalUsers: number
  totalSessions: number
  totalParticipation: number
  recentActivity: number
  totalPersonas: number
  readySessions: number
  notReadySessions: number
  performanceMetrics: {
    avgWPM: number
    avgParticipation: number
    avgPISAShared: number
    avgPISAProblem: number
    avgPISAOrganization: number
  }
  timeSeries: Array<{ date: string; count: number }>
  sessionDistribution: Array<{ name: string; count: number }>
  userEngagement: Array<{
    userId: string
    created_at: string
    sessions: { name: string }
  }>
}

export default function AdminPage() {
  const { user, loading, isAdmin: isAdminUser } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (!loading && user && !isAdminUser) {
      router.push('/')
      return
    }

    if (user && isAdminUser) {
      // Check if user is admin and fetch admin data
      fetchAdminData()
    }
  }, [user, loading, isAdminUser, router])

  const fetchAdminData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get auth token
      const {
        data: { session },
      } = await authClient.getSession()

      if (!session?.access_token) {
        // Try to get token from localStorage as fallback
        const storedToken = localStorage.getItem('auth_token')
        if (storedToken) {
          // Fetch admin statistics with stored token
          const response = await fetch('/api/admin/stats', {
            headers: {
              Authorization: `Bearer ${storedToken}`,
              'Content-Type': 'application/json',
            },
          })

          if (!response.ok) {
            if (response.status === 403) {
              throw new Error('Access denied. Admin privileges required.')
            }
            throw new Error('Failed to fetch admin data')
          }

          const data = await response.json()
          setStats(data)
          return
        }
        throw new Error('No valid session found')
      }

      // Fetch admin statistics
      const response = await fetch('/api/admin/stats', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. Admin privileges required.')
        }
        throw new Error('Failed to fetch admin data')
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error('Error fetching admin data:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (loading || isLoading) {
    return <PageLoading />
  }

  if (error) {
    return (
      <div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.push('/dashboard')}>
            Return to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Key Metrics Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Sessions
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSessions}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="text-green-600">
                  {stats.readySessions} Ready
                </Badge>
                <Badge variant="outline">
                  {stats.notReadySessions} Pending
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Participation Logs
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalParticipation}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.recentActivity} in last 24h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Personas</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPersonas}</div>
              <p className="text-xs text-muted-foreground">
                AI personas created
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Metrics */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
              <CardDescription>
                Average performance indicators across all users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.performanceMetrics.avgWPM}
                  </div>
                  <div className="text-sm text-blue-600">Words/Min</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.performanceMetrics.avgParticipation}%
                  </div>
                  <div className="text-sm text-green-600">Participation</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                PISA Collaborative Skills
              </CardTitle>
              <CardDescription>
                Average PISA collaborative problem-solving scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Shared Understanding</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${
                            (stats.performanceMetrics.avgPISAShared / 4) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">
                      {stats.performanceMetrics.avgPISAShared}/4
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Problem Solving</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${
                            (stats.performanceMetrics.avgPISAProblem / 4) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">
                      {stats.performanceMetrics.avgPISAProblem}/4
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Team Organization</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{
                          width: `${
                            (stats.performanceMetrics.avgPISAOrganization / 4) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">
                      {stats.performanceMetrics.avgPISAOrganization}/4
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>Manage user accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => router.push('/admin/users')}
            >
              View Users
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Session Management
            </CardTitle>
            <CardDescription>Manage conversation sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => router.push('/admin/sessions')}
            >
              View Sessions
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Participation Logs
            </CardTitle>
            <CardDescription>
              View detailed participation analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => router.push('/admin/participation-log')}
            >
              View Logs
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Persona Management
            </CardTitle>
            <CardDescription>Manage AI personas and characters</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => router.push('/admin/agents')}
            >
              View Personas
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
