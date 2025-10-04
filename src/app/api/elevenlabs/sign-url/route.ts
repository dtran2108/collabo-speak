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
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
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
    console.log('ElevenLabs API response:', data)
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    if (!data.signed_url) {
      console.error('No signed_url in response:', data)
      throw new Error('No signed URL in ElevenLabs response')
    }

    console.log('Returning signed URL:', data.signed_url)
    console.log('Signed URL type:', typeof data.signed_url)
    console.log('Signed URL length:', data.signed_url.length)
    return NextResponse.json({ signedUrl: data.signed_url })
  } catch (error) {
    console.error('Error generating signed URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate signed URL' },
      { status: 500 },
    )
  }
}
