'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useEffect, useRef } from 'react'
import { Persona } from '@/types/database'

interface Message {
  id: string
  message: string
  source: 'ai' | 'user'
  timestamp: string
  avatar?: string
  color: string
}

interface TranscriptProps {
  messages: Message[]
  isCensored?: boolean
  personas: Persona[]
}

export default function Transcript({
  messages,
  isCensored = false,
  personas,
}: TranscriptProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]',
      )
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  // Extract speaker name from AI message format <SpeakerName>content</SpeakerName>
  const extractSpeakerFromMessage = (message: string) => {
    const match = message.match(/^<([^>]+)>(.*)<\/[^>]+>$/)
    if (match) {
      return {
        speakerName: match[1],
        content: match[2],
      }
    }
    return {
      speakerName: 'AI Assistant',
      content: message,
    }
  }

  // Split multiple speaker messages into separate messages
  const splitMultiSpeakerMessage = (message: string) => {
    const speakerRegex = /<([^>]+)>(.*?)<\/[^>]+>/g
    const speakers = []
    let match

    while ((match = speakerRegex.exec(message)) !== null) {
      speakers.push({
        speakerName: match[1],
        content: match[2].trim(),
      })
    }

    return speakers.length > 0
      ? speakers
      : [{ speakerName: 'AI Assistant', content: message }]
  }

  // Get color for different speakers
  const getSpeakerColor = (speakerName: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-red-500',
    ]

    // Use speaker name to consistently assign colors
    let hash = 0
    for (let i = 0; i < speakerName.length; i++) {
      hash = speakerName.charCodeAt(i) + ((hash << 5) - hash)
    }

    return colors[Math.abs(hash) % colors.length]
  }

  // Censor content by replacing with dots
  const censorContent = () => {
    return '...'
  }

  const getSpeakerInfo = (source: 'ai' | 'user', message?: string) => {
    if (source === 'ai') {
      const { speakerName } = message
        ? extractSpeakerFromMessage(message)
        : { speakerName: 'AI Assistant' }
      return {
        name: speakerName,
        avatar:
          personas.find((persona) => persona.name === speakerName)?.avatarUrl ||
          speakerName.charAt(0).toUpperCase(),
        color: 'bg-blue-500',
        isUser: false,
      }
    } else {
      return {
        name: 'You',
        avatar: 'U',
        color: 'bg-green-500',
        isUser: true,
      }
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        Live Transcript
        {isCensored && (
          <Badge variant="destructive" className="ml-2">
            Content Hidden
          </Badge>
        )}
        {/* <Badge variant="secondary" className="ml-auto">
          {messages.length} messages
        </Badge> */}
      </div>
      {Boolean(messages.length) && (
        <ScrollArea
          ref={scrollAreaRef}
          className="h-[400px] p-6 border rounded-md"
        >
          <div className="space-y-4">
            {messages.map((message) => {
              // Handle multiple speakers in AI messages
              if (message.source === 'ai') {
                const speakers = splitMultiSpeakerMessage(message.message)

                return (
                  <div key={message.id} className="space-y-1">
                    {speakers.map((speaker, index) => {
                      const speakerInfo = {
                        name: speaker.speakerName,
                        avatar:
                          personas.find(
                            (persona) => persona.name === speaker.speakerName,
                          )?.avatarUrl ||
                          speaker.speakerName.charAt(0).toUpperCase(),
                        color: getSpeakerColor(speaker.speakerName),
                        isUser: false,
                      }

                      const displayContent = isCensored
                        ? censorContent()
                        : speaker.content

                      return (
                        <div
                          key={`${message.id}-${index}`}
                          className="flex gap-3 justify-start"
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={speakerInfo.avatar} />
                            <AvatarFallback
                              className={`text-white text-sm font-medium ${speakerInfo.color}`}
                            >
                              {speakerInfo.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="max-w-[70%] order-2">
                            <div className="rounded-2xl px-4 py-3 bg-muted text-foreground rounded-bl-md">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold opacity-80">
                                  {speakerInfo.name}
                                </span>
                                <span className="text-xs opacity-60">
                                  {message.timestamp}
                                </span>
                              </div>
                              <p className="text-sm leading-relaxed">
                                {displayContent}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              }

              // Handle user messages (single speaker)
              const speakerInfo = getSpeakerInfo(
                message.source,
                message.message,
              )
              const isUser = speakerInfo.isUser

              // Extract content and apply censoring if needed
              let displayContent = message.message
              if (isCensored) {
                displayContent = censorContent()
              }

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!isUser && (
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={speakerInfo.avatar} />
                      <AvatarFallback
                        className={`text-white text-sm font-medium ${speakerInfo.color}`}
                      >
                        {speakerInfo.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={`max-w-[70%] ${isUser ? 'order-1' : 'order-2'}`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        isUser
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted text-foreground rounded-bl-md'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold opacity-80">
                          {speakerInfo.name}
                        </span>
                        <span className="text-xs opacity-60">
                          {message.timestamp}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">
                        {displayContent}
                      </p>
                    </div>
                  </div>

                  {isUser && (
                    <Avatar className="w-8 h-8 order-2">
                      <AvatarImage src="" />
                      <AvatarFallback
                        className={`text-white text-sm font-medium ${speakerInfo.color}`}
                      >
                        {speakerInfo.avatar}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </>
  )
}
