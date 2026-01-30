exports.buildMissionPrompt = (topic, type, difficulty, format) => {
  const typeGuide = {
    mcq: "multiple choice questions with 4 options each",
    scenario: "email phishing or social engineering scenarios",
    challenge: "hands-on code or security challenges",
    comprehensive: "a mixed mission containing MCQs (3-5), realistic email scenarios (2-3), and 1-2 hands-on challenges"
  };

  const contentStructure = {
    mcq: `"questions": [{"question": "What is...", "options": ["A", "B", "C", "D"], "answer": 0, "hint": "hint text", "explanation": "Why this is correct"}]`,
    scenario: `"scenarios": [{"title": "Scenario", "sender": "sender@email.com", "subject": "Subject", "content": "Email content", "options": ["Option 1", "Option 2"], "answer": 0, "explanation": "Why this is correct"}]`,
    challenge: `"challenges": [{"title": "Challenge", "description": "Description", "code": "code snippet", "language": "python", "hints": ["hint1"], "correctSolution": "The exact correct answer", "validationKeywords": ["keyword1", "keyword2"]}]`,
    comprehensive: `"questions": [{"question": "What is...", "options": ["A", "B", "C", "D"], "answer": 0, "hint": "hint text", "explanation": "Why this is correct"}], "scenarios": [{"title": "Scenario", "sender": "sender@email.com", "subject": "Subject", "content": "Email content", "options": ["Option 1", "Option 2"], "answer": 0, "explanation": "Why this is correct"}], "challenges": [{"title": "Challenge", "description": "Description", "code": "code snippet", "language": "python", "hints": ["hint1"], "correctSolution": "The exact correct answer", "validationKeywords": ["keyword1", "keyword2"]}]`
  };

  return `You are a cybersecurity expert. Generate a ${difficulty} difficulty ${typeGuide[type] || type} mission about "${topic}".

Return ONLY valid JSON with this structure:
{
  "title": "Mission Title",
  "description": "Brief mission description",
  "points": ${difficulty === 'easy' ? 100 : difficulty === 'medium' ? 200 : difficulty === 'hard' ? 300 : 500},
  "content": {
    "questions": [],
    "scenarios": [],
    "challenges": [],
    ${contentStructure[type] || ''}
  }
}

Requirements:
- Return ONLY JSON, no markdown, no explanation
- For MCQ: 3-5 questions with exactly 4 options each, answer is 0-3 index, include explanation for why the answer is correct
- For Scenarios: 2-3 realistic phishing/social engineering emails with sender, subject, full content, and a set of 3-4 actionable multiple-choice options, include explanation
- For Challenges: 1-2 hands-on security challenges that include:
  * title: Name of the challenge
  * description: What the user needs to find or solve
  * code: Optional code snippet to analyze
  * language: Programming language of the code
  * hints: Array of helpful hints
  * correctSolution: THE EXACT CORRECT ANSWER (full detailed explanation)
  * validationKeywords: Array of 3-5 KEYWORDS that MUST appear in a correct answer (e.g., ["csrf", "token", "missing"] for CSRF vulnerabilities, ["sql", "injection", "input"] for SQL injection)
- IMPORTANT: validationKeywords should be lowercase and contain the essential terms that indicate a correct understanding
- If you are asked to generate a 'comprehensive' mission, ensure the JSON includes a mix: 3-5 MCQs, 2-3 scenarios, and 1-2 challenges
- All content must be realistic, educational, and safe (no real credentials/PII)
- Difficulty level: ${difficulty}
- Topic: ${topic}

Respond with JSON only.`;
};
