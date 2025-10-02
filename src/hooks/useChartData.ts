import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface WeeklyData {
  week: string
  wpm: number
  fillers: number
  participation: number
}

interface PISAData {
  scale: string
  firstDay: number
  lastDay: number
}

export function useChartData() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [hasEnoughSessions, setHasEnoughSessions] = useState(false)
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [pisaData, setPisaData] = useState<PISAData[]>([])
  const [totalSessions, setTotalSessions] = useState(0)

  useEffect(() => {
    if (user) {
      loadChartData()
    } else {
      setLoading(false)
      setHasEnoughSessions(false)
      setWeeklyData([])
      setPisaData([])
      setTotalSessions(0)
    }
  }, [user])

  const loadChartData = async () => {
    try {
      setLoading(true)
      const chartData = await api.charts.getChartData()
      
      setHasEnoughSessions(chartData.hasEnoughSessions)
      setWeeklyData(chartData.weeklyData)
      setPisaData(chartData.pisaData)
      setTotalSessions(chartData.totalSessions)
    } catch (error) {
      console.error('Error loading chart data:', error)
      setHasEnoughSessions(false)
      setWeeklyData([])
      setPisaData([])
      setTotalSessions(0)
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    hasEnoughSessions,
    weeklyData,
    pisaData,
    totalSessions
  }
}