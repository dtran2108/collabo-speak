import { Message } from '@/types/conversation'

export const generateId = (): string => Math.random().toString(36).substr(2, 9)

export const getCurrentTimestamp = (): string =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

export const createMessage = (
  message: string,
  source: 'ai' | 'user',
  color: string = source === 'ai' ? 'bg-blue-500' : 'bg-green-500'
): Message => ({
  id: generateId(),
  message,
  source,
  timestamp: getCurrentTimestamp(),
  color,
})

export const parseConversationMessage = (message: unknown): Message => {
  try {
    // Parse the message if it's a string
    const parsedMessage =
      typeof message === 'string' ? JSON.parse(message) : message

    // Check if the message has the expected format
    if (
      parsedMessage &&
      typeof parsedMessage === 'object' &&
      'message' in parsedMessage &&
      'source' in parsedMessage
    ) {
      return createMessage(
        parsedMessage.message,
        parsedMessage.source,
        parsedMessage.source === 'ai' ? 'bg-blue-500' : 'bg-green-500'
      )
    } else {
      // Handle other message formats or fallback
      return createMessage(
        typeof message === 'string' ? message : JSON.stringify(message),
        'ai', // Default to AI if source is unclear
        'bg-blue-500'
      )
    }
  } catch (error) {
    console.error('Error parsing message:', error)
    // Add a fallback message
    return createMessage(
      typeof message === 'string' ? message : 'Received a message',
      'ai',
      'bg-blue-500'
    )
  }
}
