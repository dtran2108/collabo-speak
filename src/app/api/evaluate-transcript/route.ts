import { NextRequest, NextResponse } from 'next/server'

interface EvaluationRequest {
  transcript: string
}

interface ChatGPTEvaluation {
  strengths: string[]
  improvements: string[]
  tips: string[]
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

    // Prepare the prompt for ChatGPT
    const prompt = `
Your goal is to provide encouraging feedback based ONLY on the student's speech in the transcript. The student's goal was to improve: 1) Collaborative problem solving (based on the PISA framework) 2) Oral skills (based on the CAF framework) Your feedback must always include the following structure: Today's session: {minutes} min {seconds} sec (Student performance only) → WPM: {wpm} | Fillers: {fillers}/min ▼ | Turns: {turns}% Then give 3 clear points: 👍 What you did well 🔧 What to work on 💡 Tips for next time Guidelines: - Report WPM, Fillers, and Turns only for the student (exclude all AI persona data). - Use friendly, encouraging, and easy-to-understand language (no technical jargon like “CAF” or “syntax”). - Underlying frameworks: • Complexity = sentence variety, elaboration of ideas • Accuracy = clarity, correctness of English • Fluency = speed, smoothness, filler word control • PISA (collaboration): – Shared understanding = listening, responding, ensuring common understanding – Taking action = suggesting solutions, moving discussion forward – Team organisation = inviting/including others, coordinating group - Always include at least one example of something the student did well. - Always provide one specific, actionable suggestion. - Keep tone positive, constructive, and student-friendly. Return your evaluation in the following JSON format:

{
  "strengths": ["strength1", "strength2", "strength3", "strength4",...],
  "improvements": ["improvement1", "improvement2", "improvement3", "improvement4",...],
  "tips": ["tip1", "tip2", "tip3", "tip4",...],
}

Focus on:
- Communication skills (clarity, pace, vocabulary)
- Engagement level (questions asked, active listening)
- Speaking confidence and fluency
- Areas for improvement
- Specific, actionable advice

Transcript:
${transcript}

Please provide a detailed, constructive evaluation in the exact JSON format specified above.`

    // Call ChatGPT API
    const chatGPTResponse = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content:
                "You are a collaborative skills analyst and supportive English speaking coach. Your goal is to provide encouraging feedback based ONLY on the student's speech in the transcript. Ignore all turns from AI personas (e.g., Fiona, Eli, Clara).",
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
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
      evaluation = JSON.parse(jsonString)
    } catch (parseError) {
      console.error('Failed to parse ChatGPT response:', parseError)
      console.error('Raw response:', evaluationText)
      return NextResponse.json(
        { error: 'Failed to parse evaluation response' },
        { status: 500 },
      )
    }

    // Validate the response structure
    if (!evaluation.strengths || !evaluation.improvements || !evaluation.tips) {
      return NextResponse.json(
        { error: 'Invalid evaluation format received' },
        { status: 500 },
      )
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
