import { NextRequest, NextResponse } from 'next/server'
import { getPrompt } from './prompt'

interface EvaluationRequest {
  transcript: string
}

interface ChatGPTEvaluation {
  strengths: string[]
  improvements: string[]
  tips: string[]
  big_picture_thinking: string[]
  words_per_min: number
  filler_words_per_min: number
  participation_percentage: number
  duration: number
  pisa_shared_understanding: number
  pisa_problem_solving_action: number
  pisa_team_organization: number
}

export async function POST(request: NextRequest) {
  try {
    const { transcript }: EvaluationRequest = await request.json()

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 },
      )
    }
    // Call ChatGPT API
    const chatGPTResponse = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content:
                "You are a collaborative skills analyst and supportive English speaking coach. Your goal is to provide encouraging feedback based ONLY on the student's speech in the transcript. Ignore all turns from AI personas (e.g., Fiona, Eli, Clara). You MUST return your response in valid JSON format only.",
            },
            {
              role: 'user',
              content: getPrompt(transcript),
            },
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      },
    )

    if (!chatGPTResponse.ok) {
      console.error(
        'ChatGPT API error:',
        chatGPTResponse.status,
        chatGPTResponse.statusText,
      )
      return NextResponse.json(
        { error: 'Failed to get evaluation from ChatGPT' },
        { status: 500 },
      )
    }

    const chatGPTData = await chatGPTResponse.json()
    const evaluationText = chatGPTData.choices[0]?.message?.content

    if (!evaluationText) {
      return NextResponse.json(
        { error: 'No evaluation received from ChatGPT' },
        { status: 500 },
      )
    }

    // Parse the JSON response
    let evaluation: ChatGPTEvaluation
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = evaluationText.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[0] : evaluationText
      console.log('Attempting to parse JSON:', jsonString.substring(0, 200) + '...')
      evaluation = JSON.parse(jsonString)
    } catch (parseError) {
      console.error('Failed to parse ChatGPT response:', parseError)
      console.error('Raw response length:', evaluationText.length)
      console.error('Raw response preview:', evaluationText.substring(0, 500))
      return NextResponse.json(
        { 
          error: 'Failed to parse evaluation response',
          details: parseError instanceof Error ? parseError.message : 'Unknown parsing error',
          responsePreview: evaluationText.substring(0, 200)
        },
        { status: 500 },
      )
    }

    // Validate the response structure
    if (
      !evaluation.strengths ||
      !evaluation.improvements ||
      !evaluation.tips ||
      !evaluation.big_picture_thinking
    ) {
      return NextResponse.json(
        { error: 'Invalid evaluation format received' },
        { status: 500 },
      )
    }

    if (
      !evaluation.words_per_min ||
      !evaluation.filler_words_per_min ||
      !evaluation.participation_percentage ||
      !evaluation.duration ||
      !evaluation.pisa_shared_understanding ||
      !evaluation.pisa_problem_solving_action ||
      !evaluation.pisa_team_organization
    ) {
      console.error('Invalid evaluation format received:', evaluation)
    }

    return NextResponse.json({ evaluation })
  } catch (error) {
    console.error('Error evaluating transcript:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
