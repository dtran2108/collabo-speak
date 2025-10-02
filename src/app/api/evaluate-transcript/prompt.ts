export const getPrompt = (transcript: string) => {
  return `Your goal is to provide encouraging feedback based ONLY on the student's speech in the transcript. The student's goal was to improve:
1) Collaborative problem solving (based on the PISA framework)
2) Oral skills (based on the CAF framework)

Then give 3 clear points: What you did well, What to work on, Tips for next time
Guidelines:
- Report WPM, Fillers, and Turns only for the student (exclude all AI persona data).
- Use friendly, encouraging, and easy-to-understand language (no technical jargon like “CAF” or “syntax”).
- Always include at least one example of something the student did well.
- Always provide one specific, actionable suggestion.
- Keep tone positive, constructive, and student-friendly.
- Underlying frameworks:
• Complexity = sentence variety, elaboration of ideas
• Accuracy = clarity, correctness of English
• Fluency = speed, smoothness, filler word control
- PISA (collaboration):
    • Shared understanding = listening, responding, ensuring common understanding
    • Taking action = suggesting solutions, moving discussion forward
    • Team organisation = inviting/including others, coordinating group
- Calculate the following metrics ONLY based on the student's speech:
	1.	Session length (duration field in the JSON)
	•	Session length = timestamp of the last turn (any speaker) − timestamp of the first turn (any speaker).
	•	Format as {minutes} min {seconds} sec.
	2.	Student words per minute (WPM) (words_per_min field in the JSON)
	•	For each student turn:
	•	Turn duration = timestamp of next turn (any speaker) − timestamp of this student turn.
	•	If the student turn is the last turn of the transcript, use:
turn duration = timestamp of last turn of session − timestamp of student turn.
	•	Count all words in that turn.
	•	Sum all student words → total_words.
	•	Sum all student speaking durations in minutes → total_student_minutes.
	•	WPM = total_words ÷ total_student_minutes.
	3.	Student fillers per minute (filler_words_per_min field in the JSON)
	•	Count all filler words in student speech (e.g., “um”, “ah”, “like”, “you know”) → total_fillers.
	•	Divide by total_student_minutes → fillers per minute.
	4.	Student participation percentage (participation_percentage field in the JSON)
	•	Count all student turns → total_student_turns.
	•	Count all turns → total_turns.
	•	Participation percentage = (total_student_turns ÷ total_turns) × 100.
Return your evaluation in the following JSON format:

{
  "strengths": ["strength1", "strength2", "strength3", "strength4",...],
  "improvements": ["improvement1", "improvement2", "improvement3", "improvement4",...],
  "tips": ["tip1", "tip2", "tip3", "tip4",...],
  "words_per_min": "an integer value for words per minute",
  "filler_words_per_min": "an integer value for fillers per minute",
  "participation_percentage": "a float value for turns percentage",
  "duration": "{minutes} minutes {seconds} seconds",
  "pisa_shared_understanding": "an integer value for the PISA shared understanding score on the scale of 1 to 4",
  "pisa_problem_solving_action": "an integer value for the PISA problem solving action score on the scale of 1 to 4",
  "pisa_team_organization": "an integer value for the PISA team organization score on the scale of 1 to 4"
}

Focus on:
- Communication skills (clarity, pace, vocabulary)
- Engagement level (questions asked, active listening)
- Speaking confidence and fluency
- Areas for improvement
- Specific, actionable advice

Transcript:
${transcript}

Please provide a detailed, constructive evaluation in the EXACT JSON FORMAT specified above.`
}
