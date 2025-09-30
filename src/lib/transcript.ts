interface Message {
  id: string
  message: string
  source: 'ai' | 'user'
  timestamp: string
  avatar?: string
  color: string
}

/**
 * Formats messages into a transcript format with timestamps
 * @param messages Array of conversation messages
 * @param startTime Optional start time for the conversation
 * @returns Formatted transcript string
 */
export function formatTranscript(messages: Message[], startTime?: Date): string {
  const conversationStart = startTime || new Date()
  const startTimeStr = conversationStart.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })

  let transcript = `// Conversation starts at ${startTimeStr}\n`

  messages.forEach((message) => {
    const speaker = message.source === 'user' ? 'User' : extractSpeakerName(message.message)
    transcript += `${speaker} (${message.timestamp}): ${extractMessageContent(message.message)}\n`
  })

  const endTime = new Date()
  const endTimeStr = endTime.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })

  transcript += `// Conversation ends at ${endTimeStr}\n`

  return transcript
}

/**
 * Extracts speaker name from AI messages that contain <SpeakerName>content</SpeakerName> format
 * @param message The message content
 * @returns Speaker name or 'AI Assistant' as fallback
 */
function extractSpeakerName(message: string): string {
  const match = message.match(/^<([^>]+)>(.*)<\/[^>]+>$/)
  if (match) {
    return match[1]
  }
  return 'AI Assistant'
}

/**
 * Extracts message content from AI messages that contain <SpeakerName>content</SpeakerName> format
 * @param message The message content
 * @returns Clean message content without speaker tags
 */
function extractMessageContent(message: string): string {
  const match = message.match(/^<([^>]+)>(.*)<\/[^>]+>$/)
  if (match) {
    return match[2]
  }
  return message
}

/**
 * Generates a unique filename for the transcript
 * @param sessionId The session ID
 * @param userId The user ID
 * @returns Unique filename for the transcript
 */
export function generateTranscriptFileName(sessionId: string, userId: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `transcript_${sessionId}_${userId}_${timestamp}.txt`
}
