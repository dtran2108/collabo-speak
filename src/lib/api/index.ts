// Import all API modules
import { authApi } from './auth'
import { sessionsApi } from './sessions'
import { participationLogApi } from './participation-log'
import { transcriptsApi } from './transcripts'
import { evaluationApi } from './evaluation'
import { participationApi } from './participation'
import { chartsApi } from './charts'
import { userProfilesApi } from './user-profiles'

// Export all API modules
export { authApi } from './auth'
export { sessionsApi } from './sessions'
export { participationLogApi } from './participation-log'
export { transcriptsApi } from './transcripts'
export { evaluationApi } from './evaluation'
export { participationApi } from './participation'
export { chartsApi } from './charts'
export { userProfilesApi } from './user-profiles'

// Re-export shared utilities
export { getAuthHeaders, handleResponse, API_BASE_URL } from './shared'

// Main API object for backward compatibility
export const api = {
  auth: authApi,
  sessions: sessionsApi,
  participationLog: participationLogApi,
  transcripts: transcriptsApi,
  evaluation: evaluationApi,
  participation: participationApi,
  charts: chartsApi,
  userProfiles: userProfilesApi,
}
