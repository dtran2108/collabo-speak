import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { agentId } = await request.json()

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 },
      )
    }

    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 },
      )
    }
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}&source=react_sdk&version=0.7.1`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey,
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs API error:', errorText)
      throw new Error(`ElevenLabs API error: ${errorText}`)
    }

    const data = await response.json()
    console.log('ElevenLabs conversation token response:', data)

    // The API returns 'token' field, not 'conversation_token'
    if (!data.token) {
      console.error('No token in response:', data)
      throw new Error('No conversation token in ElevenLabs response')
    }

    console.log('Returning conversation token:', data.token)
    return NextResponse.json({ conversationToken: data.token })
  } catch (error) {
    console.error('Error generating conversation token:', error)
    return NextResponse.json(
      { error: 'Failed to generate conversation token' },
      { status: 500 },
    )
  }
}
