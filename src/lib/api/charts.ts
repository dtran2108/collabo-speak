import { getAuthHeaders, handleResponse, API_BASE_URL } from './shared'

export const chartsApi = {
  async getChartData(): Promise<{
    hasEnoughSessions: boolean
    weeklyData: Array<{
      week: string
      wpm: number
      fillers: number
      participation: number
    }>
    pisaData: Array<{
      scale: string
      firstSession: number
      lastSession: number
    }>
    totalSessions: number
  }> {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/chart-data`, {
      headers,
    })
    return handleResponse(response)
  },
}
