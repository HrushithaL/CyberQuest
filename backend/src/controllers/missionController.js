const { Mission } = require("../models/Mission");
const User = require("../models/User");
const Progress = require("../models/Progress");
const { buildMissionPrompt } = require("../utils/prompt");
const { generateMockMission } = require("../utils/mockMissions");
const OpenAI = require("openai").default;

// Lazy-load OpenAI client to ensure env vars are available
let client = null;
const getClient = () => {
  if (!client) {
    const baseURL = process.env.OPENAI_BASE_URL || undefined; // e.g., https://openrouter.ai/api/v1 or http://localhost:11434/v1
    const defaultHeaders = {};
    if (baseURL && /openrouter\.ai/i.test(baseURL)) {
      if (process.env.OPENROUTER_SITE_URL) defaultHeaders["HTTP-Referer"] = process.env.OPENROUTER_SITE_URL;
      if (process.env.OPENROUTER_APP_NAME) defaultHeaders["X-Title"] = process.env.OPENROUTER_APP_NAME;
    }

    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL,
      defaultHeaders: Object.keys(defaultHeaders).length ? defaultHeaders : undefined,
    });
  }
  return client;
};

// Simple retry wrapper for OpenAI calls with exponential backoff
const callOpenAIWithRetry = async (callFn, maxAttempts = 3, baseDelay = 800) => {
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      return await callFn();
    } catch (err) {
      attempt += 1;
      const status = err?.response?.status || err?.status || null;
      // If rate limited (429), wait and retry; otherwise re-throw for non-retryable errors
      if (status === 429 && attempt < maxAttempts) {
        const wait = baseDelay * Math.pow(2, attempt - 1);
        console.warn(`OpenAI rate limit (429) – attempt ${attempt} of ${maxAttempts}. Waiting ${wait}ms before retrying.`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      // For other transient conditions (network errors), we can also retry a couple attempts
      if (attempt < maxAttempts) {
        const wait = baseDelay * Math.pow(2, attempt - 1);
        console.warn(`OpenAI error (attempt ${attempt}): ${err.message || err}. Retrying after ${wait}ms...`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw err;
    }
  }
};

// Lightweight in-memory cache for recent evaluations to avoid repeated AI calls
const crypto = require('crypto');
const evaluationCache = new Map();
const DEFAULT_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
// Policy: do not generate official answers during validation unless explicitly allowed
const ALLOW_OFFICIAL_GENERATION_ON_SUBMIT = process.env.ALLOW_OFFICIAL_GENERATION_ON_SUBMIT === 'true';

function cacheGet(key) {
  const entry = evaluationCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    evaluationCache.delete(key);
    return null;
  }
  return entry.value;
}

function cacheSet(key, value, ttl = DEFAULT_CACHE_TTL_MS) {
  evaluationCache.set(key, { value, expiry: Date.now() + ttl });
}

function hashSubmission(str) {
  return crypto.createHash('sha256').update(String(str || '')).digest('hex').slice(0, 16);
}

// Allow injection/mocking of the OpenAI caller for tests
let openAICaller = callOpenAIWithRetry;
const DEFAULT_OPENAI_CALLER = callOpenAIWithRetry;
exports.__setOpenAICaller = (fn) => { openAICaller = fn || callOpenAIWithRetry; };
exports.__clearEvaluationCache = () => { evaluationCache.clear(); };

// Helper to compare official answer and a submission, returns { match, score }
function compareAnswers(officialAnswer, submittedText) {
  const normalizeText = (s) => s.toString().trim().toLowerCase().replace(/\s+/g, ' ');
  const normalizeCode = (s) => s.toString().replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, '').replace(/[;]+/g, '');
  const isCodeLike = (str) => /\b(function|def|=>|console\.|\{|\}|\(|\)|\[|\]|;|import |from )/i.test(str) || str.split('\n').length > 3;

  try {
    let a = officialAnswer;
    let b = submittedText;
    if (isCodeLike(a) || isCodeLike(b)) {
      a = normalizeCode(a);
      b = normalizeCode(b);
    } else {
      a = normalizeText(a);
      b = normalizeText(b);
    }

    const levenshtein = (u, v) => {
      const m = u.length, n = v.length;
      const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
      for (let i = 0; i <= m; i++) dp[i][0] = i;
      for (let j = 0; j <= n; j++) dp[0][j] = j;
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          const cost = u[i - 1] === v[j - 1] ? 0 : 1;
          dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
        }
      }
      return dp[m][n];
    };

    const dist = levenshtein(a, b);
    const maxLen = Math.max(a.length, b.length) || 1;
    const aiMatchScore = Math.max(0, 1 - dist / maxLen);
    const aiMatch = aiMatchScore >= 0.85 || a === b;
    return { aiMatch, aiMatchScore };
  } catch (e) {
    return { aiMatch: false, aiMatchScore: 0 };
  }
}

// Helper: token-overlap partial score for short string solutions
function partialStringScore(solution, submittedText) {
  const sol = String(solution || '').toLowerCase();
  const sub = String(submittedText || '').toLowerCase();
  // Split by non-alphanumeric (captures IP segments or keywords)
  const tokens = sol.split(/[^a-z0-9]+/).filter(Boolean);
  if (tokens.length === 0) return 0;
  let matched = 0;
  tokens.forEach(t => { if (t && sub.includes(t)) matched++; });
  return matched / tokens.length; // 0..1
}

// Helper: validate event ordering challenges with partial correctness
function validateEventOrdering(solution, submittedText) {
  const correctOrder = solution.correctOrder || [];
  const correctIndices = solution.correctIndices || [];

  if (!Array.isArray(correctOrder) || correctOrder.length === 0) {
    return { scoreFraction: 0, correct: 0, total: 0, explanation: 'No correct order defined' };
  }

  try {
    // Parse submitted answer - expect JSON array or comma-separated list
    let submittedOrder = [];

    // Try parsing as JSON first
    try {
      submittedOrder = JSON.parse(submittedText);
    } catch (e) {
      // Try comma-separated format
      submittedOrder = String(submittedText || '')
        .split(',')
        .map(s => s.trim())
        .filter(s => s);
    }

    if (!Array.isArray(submittedOrder) || submittedOrder.length === 0) {
      return { scoreFraction: 0, correct: 0, total: correctOrder.length, explanation: 'Invalid format. Expected array or comma-separated list.' };
    }

    // Normalize both arrays for comparison (strip leading numbers like "1. ")
    const normalize = (str) => str.toString().trim().toLowerCase().replace(/^\d+\.\s*/, '');
    const normalizedCorrect = correctOrder.map(normalize);
    const normalizedSubmitted = submittedOrder.map(normalize);

    // Calculate partial correctness based on correct positions
    let correctPositions = 0;
    const total = Math.min(normalizedCorrect.length, normalizedSubmitted.length);

    for (let i = 0; i < total; i++) {
      if (normalizedCorrect[i] === normalizedSubmitted[i]) {
        correctPositions++;
      }
    }

    // Also check for correct pairs (consecutive items in correct order)
    let correctPairs = 0;
    for (let i = 0; i < normalizedSubmitted.length - 1; i++) {
      const item1 = normalizedSubmitted[i];
      const item2 = normalizedSubmitted[i + 1];
      const idx1 = normalizedCorrect.indexOf(item1);
      const idx2 = normalizedCorrect.indexOf(item2);

      if (idx1 !== -1 && idx2 !== -1 && idx2 === idx1 + 1) {
        correctPairs++;
      }
    }

    // Score based on both position accuracy and pair correctness
    const positionScore = correctPositions / normalizedCorrect.length;
    const pairScore = normalizedCorrect.length > 1 ? (correctPairs / (normalizedCorrect.length - 1)) : 0;
    const scoreFraction = (positionScore * 0.7) + (pairScore * 0.3); // Weighted average

    let explanation = '';
    if (scoreFraction >= 1.0) {
      explanation = 'Perfect! All events in correct order.';
    } else if (scoreFraction >= 0.7) {
      explanation = `Good attempt! ${correctPositions} out of ${normalizedCorrect.length} positions correct, ${correctPairs} correct pairs.`;
    } else if (scoreFraction > 0) {
      explanation = `Partially correct. ${correctPositions} out of ${normalizedCorrect.length} positions correct.`;
    } else {
      explanation = 'Incorrect order. Review the attack lifecycle.';
    }

    return {
      scoreFraction: Math.max(0, Math.min(1, scoreFraction)),
      correct: correctPositions,
      total: normalizedCorrect.length,
      explanation
    };
  } catch (err) {
    return { scoreFraction: 0, correct: 0, total: correctOrder.length, explanation: 'Error parsing submission: ' + err.message };
  }
}

const calculatePoints = (difficulty) => ({
  easy: 100,
  medium: 200,
  hard: 300,
  expert: 500
}[difficulty] || 100);

// Helper: evaluate a single challenge submission using AI (optional) then deterministic fallback
const evaluateSubmission = async (c, submittedText, options = {}) => {
  const { forceGenerateOfficial = false } = options;
  let scoreFraction = 0;
  let note = '';
  let testsPassed = 0;
  let totalTests = 0;
  let aiUsed = false;
  let aiHint = null;
  let aiExplanation = null;
  let aiRecommendHint = false;
  // Prefer explicit expected or previously generated officialAnswer
  let officialAnswer = c?.expected || c?.officialAnswer || null;
  let aiGeneratedAnswer = false;

  // Build cache key and short-circuit if cached
  const challengeId = (c && (c._id || c.id || c.title)) ? String(c._id || c.id || c.title) : 'unknown';
  const cacheKey = `${challengeId}:${hashSubmission(submittedText)}`;
  const cached = cacheGet(cacheKey);
  if (cached) {
    return cached;
  }

  // DETERMINISTIC VALIDATION: Check correctSolution first (highest priority)
  if (c?.correctSolution && submittedText) {
    const solution = c.correctSolution;

    // Handle different types of correctSolution
    if (typeof solution === 'object' && solution.type === 'ordering') {
      // Event ordering challenge
      const result = validateEventOrdering(solution, submittedText);
      scoreFraction = result.scoreFraction;
      note = result.explanation;
      testsPassed = result.correct;
      totalTests = result.total;

      const res = {
        scoreFraction: Number(scoreFraction.toFixed(3)),
        testsPassed,
        totalTests,
        isCorrect: scoreFraction >= 1.0,
        correctness: scoreFraction >= 1.0 ? 'correct' : (scoreFraction > 0 ? 'partially correct' : 'incorrect'),
        explanation: note,
        officialAnswer: null,
        aiGeneratedAnswer: false,
        aiUsed: false,
        aiHint: null,
        aiExplanation: null,
        aiRecommendHint: false,
        aiMatch: false,
        aiMatchScore: 0
      };
      cacheSet(cacheKey, res);
      return res;
    } else if (typeof solution === 'string') {
      // Simple string comparison (e.g., IP address, single answer) with partial overlap
      const { aiMatch, aiMatchScore } = compareAnswers(solution, submittedText);
      const overlap = partialStringScore(solution, submittedText);
      const blended = Math.max(aiMatchScore, overlap);
      scoreFraction = aiMatch ? 1.0 : (blended >= 0.3 ? blended : 0);
      note = aiMatch ? 'Correct answer' : (scoreFraction > 0 ? `Partially correct (${Math.round(scoreFraction * 100)}% match)` : 'Incorrect answer');

      const res = {
        scoreFraction: Number(scoreFraction.toFixed(3)),
        testsPassed: aiMatch ? 1 : 0,
        totalTests: 1,
        isCorrect: aiMatch,
        correctness: aiMatch ? 'correct' : (scoreFraction > 0 ? 'partially correct' : 'incorrect'),
        explanation: note,
        officialAnswer: null,
        aiGeneratedAnswer: false,
        aiUsed: false,
        aiHint: null,
        aiExplanation: null,
        aiRecommendHint: false,
        aiMatch,
        aiMatchScore: Number(aiMatchScore.toFixed(3))
      };
      cacheSet(cacheKey, res);
      return res;
    } else if (Array.isArray(solution)) {
      // Array of correct answers (multiple acceptable answers)
      let bestMatch = 0;
      let bestAnswer = solution[0];

      for (const ans of solution) {
        const { aiMatchScore } = compareAnswers(ans, submittedText);
        if (aiMatchScore > bestMatch) {
          bestMatch = aiMatchScore;
          bestAnswer = ans;
        }
      }

      const isCorrect = bestMatch >= 0.85;
      scoreFraction = isCorrect ? 1.0 : (bestMatch >= 0.7 ? bestMatch : 0);
      note = isCorrect ? 'Correct answer' : (scoreFraction > 0 ? `Partially correct (${Math.round(scoreFraction * 100)}% match)` : 'Incorrect answer');

      const res = {
        scoreFraction: Number(scoreFraction.toFixed(3)),
        testsPassed: isCorrect ? 1 : 0,
        totalTests: 1,
        isCorrect,
        correctness: isCorrect ? 'correct' : (scoreFraction > 0 ? 'partially correct' : 'incorrect'),
        explanation: note,
        officialAnswer: null,
        aiGeneratedAnswer: false,
        aiUsed: false,
        aiHint: null,
        aiExplanation: null,
        aiRecommendHint: false,
        aiMatch: isCorrect,
        aiMatchScore: Number(bestMatch.toFixed(3))
      };
      cacheSet(cacheKey, res);
      return res;
    }
  }

  // KEYWORD-BASED VALIDATION: Check if user's answer contains required keywords
  if (Array.isArray(c?.validationKeywords) && c.validationKeywords.length > 0 && submittedText) {
    const keywords = c.validationKeywords.map(k => k.toLowerCase().trim());
    const submittedLower = submittedText.toLowerCase();

    let matchedKeywords = 0;
    const matchedList = [];
    const missedList = [];

    keywords.forEach(keyword => {
      if (submittedLower.includes(keyword)) {
        matchedKeywords++;
        matchedList.push(keyword);
      } else {
        missedList.push(keyword);
      }
    });

    const totalKeywords = keywords.length;
    scoreFraction = matchedKeywords / totalKeywords;
    const isCorrect = scoreFraction >= 0.7; // 70% threshold for correct

    let explanation = '';
    if (scoreFraction >= 1.0) {
      explanation = 'Excellent! Your answer contains all the key concepts.';
    } else if (scoreFraction >= 0.7) {
      explanation = `Good! You identified ${matchedKeywords} out of ${totalKeywords} key concepts.`;
    } else if (scoreFraction > 0) {
      explanation = `Partially correct. You mentioned: ${matchedList.join(', ')}. Missing concepts: ${missedList.join(', ')}.`;
    } else {
      explanation = `Incorrect. Your answer should mention: ${keywords.join(', ')}.`;
    }

    const res = {
      scoreFraction: Number(scoreFraction.toFixed(3)),
      testsPassed: matchedKeywords,
      totalTests: totalKeywords,
      isCorrect,
      correctness: scoreFraction >= 1.0 ? 'correct' : (scoreFraction >= 0.7 ? 'correct' : (scoreFraction > 0 ? 'partially correct' : 'incorrect')),
      explanation,
      officialAnswer: c.correctSolution || null,
      aiGeneratedAnswer: false,
      aiUsed: false,
      aiHint: missedList.length > 0 ? `Hint: Consider mentioning "${missedList[0]}" in your answer.` : null,
      aiExplanation: explanation,
      aiRecommendHint: scoreFraction < 0.7,
      aiMatch: isCorrect,
      aiMatchScore: scoreFraction
    };
    cacheSet(cacheKey, res);
    return res;
  }

  // FALLBACK: Auto-extract validation keywords from challenge title/description for existing missions
  if (!Array.isArray(c?.validationKeywords) && submittedText && (c?.title || c?.description)) {
    // Common cybersecurity keywords to look for based on challenge context
    const securityKeywords = {
      'csrf': ['csrf', 'token', 'cross-site', 'forgery', 'request'],
      'xss': ['xss', 'script', 'cross-site', 'scripting', 'injection', 'sanitize'],
      'sql': ['sql', 'injection', 'query', 'database', 'input', 'parameterized'],
      'path': ['path', 'traversal', 'directory', 'file', 'sanitize', 'validate'],
      'traversal': ['path', 'traversal', 'directory', '../', 'file', 'access'],
      'file': ['file', 'path', 'traversal', 'inclusion', 'lfi', 'rfi', 'validate'],
      'command': ['command', 'injection', 'shell', 'execute', 'os', 'system'],
      'buffer': ['buffer', 'overflow', 'memory', 'bounds', 'stack'],
      'authentication': ['authentication', 'password', 'login', 'session', 'credential'],
      'authorization': ['authorization', 'permission', 'access', 'role', 'privilege'],
      'encryption': ['encryption', 'decrypt', 'cipher', 'key', 'ssl', 'tls', 'https'],
      'phishing': ['phishing', 'suspicious', 'fake', 'malicious', 'link', 'email'],
      'vulnerability': ['vulnerability', 'exploit', 'attack', 'security', 'flaw'],
      'input': ['input', 'validation', 'sanitize', 'sanitization', 'user', 'untrusted'],
      'open': ['file', 'path', 'traversal', 'access', 'validate', 'sanitize']
    };

    const titleLower = (c.title || '').toLowerCase();
    const descLower = (c.description || '').toLowerCase();
    const contextText = titleLower + ' ' + descLower;

    // Find matching keyword category
    let extractedKeywords = [];
    for (const [category, keywords] of Object.entries(securityKeywords)) {
      if (contextText.includes(category)) {
        extractedKeywords = keywords;
        break;
      }
    }

    // If found keywords, validate against them
    if (extractedKeywords.length > 0) {
      const submittedLower = submittedText.toLowerCase();
      let matchedKeywords = 0;
      const matchedList = [];
      const missedList = [];

      extractedKeywords.forEach(keyword => {
        if (submittedLower.includes(keyword)) {
          matchedKeywords++;
          matchedList.push(keyword);
        } else {
          missedList.push(keyword);
        }
      });

      // For auto-extracted keywords, require at least 2 matches (more lenient)
      const totalKeywords = extractedKeywords.length;
      scoreFraction = matchedKeywords / totalKeywords;
      const isCorrect = matchedKeywords >= 2 || scoreFraction >= 0.5;

      let explanation = '';
      if (matchedKeywords >= 3) {
        explanation = 'Excellent! Your answer demonstrates good understanding of the vulnerability.';
      } else if (matchedKeywords >= 2) {
        explanation = `Good! You identified key concepts: ${matchedList.join(', ')}.`;
      } else if (matchedKeywords >= 1) {
        explanation = `Partially correct. You mentioned: ${matchedList.join(', ')}. Try to be more specific about the vulnerability type.`;
      } else {
        explanation = `Incorrect. This appears to be a ${Object.keys(securityKeywords).find(k => contextText.includes(k)) || 'security'} challenge. Consider what security issue the code has.`;
      }

      const res = {
        scoreFraction: Number(scoreFraction.toFixed(3)),
        testsPassed: matchedKeywords,
        totalTests: totalKeywords,
        isCorrect,
        correctness: isCorrect ? 'correct' : (matchedKeywords > 0 ? 'partially correct' : 'incorrect'),
        explanation,
        officialAnswer: c.correctSolution || null,
        aiGeneratedAnswer: false,
        aiUsed: false,
        aiHint: missedList.length > 0 ? `Hint: Think about "${missedList[0]}" in the context of this security challenge.` : null,
        aiExplanation: explanation,
        aiRecommendHint: !isCorrect,
        aiMatch: isCorrect,
        aiMatchScore: scoreFraction
      };
      cacheSet(cacheKey, res);
      return res;
    }
  }

  // Early-match against existing officialAnswer/expected (avoid AI call if close match)
  if (officialAnswer && submittedText) {
    const { aiMatch, aiMatchScore } = compareAnswers(officialAnswer, submittedText);
    if (aiMatch) {
      const res = {
        scoreFraction: 1.0,
        testsPassed: 0,
        totalTests: 0,
        isCorrect: true,
        correctness: 'correct',
        explanation: 'Matched official answer',
        officialAnswer,
        aiGeneratedAnswer: false,
        aiUsed: false,
        aiHint: null,
        aiExplanation: null,
        aiRecommendHint: false,
        aiMatch: true,
        aiMatchScore: Number(aiMatchScore.toFixed(3))
      };
      cacheSet(cacheKey, res);
      return res;
    }
  }

  const aiEvalEnabled = (process.env.ENABLE_AI_EVAL === 'true' && process.env.OPENAI_API_KEY) || (openAICaller !== DEFAULT_OPENAI_CALLER);

  // Always try AI when force is true, or when no deterministic data exists
  const shouldTryAI = forceGenerateOfficial || (!c?.correctSolution && !c?.expected && (!Array.isArray(c?.testCases) || c.testCases.length === 0));

  if (submittedText && aiEvalEnabled && shouldTryAI) {
    console.log('[AI Eval] Attempting AI evaluation for challenge:', c?.title || 'unknown');

    try {
      const combinedPrompt = {
        instruction: "You are an automated cybersecurity grader. Given the challenge title, description, code snippet (if any), and a user's submission, evaluate the answer and provide the correct solution. Return ONLY JSON with the structure: { grade: { scoreFraction: number (0-1 where 1 is fully correct), explanation: string (explain why correct/incorrect), hint: string|null }, officialAnswer: string (the correct answer/solution) }. Only output JSON.",
        challenge: {
          title: c.title || '',
          description: c.description || '',
          code: c.code || '',
          language: c.language || '',
          expected: c.expected || null,
          testCases: Array.isArray(c.testCases) ? c.testCases : []
        },
        submission: submittedText
      };

      console.log('[AI Eval] Sending prompt to AI...');
      const aiRes = await openAICaller(() => getClient().chat.completions.create({
        model: process.env.AI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: JSON.stringify(combinedPrompt) }],
        temperature: 0.0
      }));

      let aiText = aiRes.choices?.[0]?.message?.content?.trim();
      console.log('[AI Eval] AI Response received:', aiText?.substring(0, 200) + '...');

      if (aiText) {
        try {
          let parsed = null;
          try {
            parsed = JSON.parse(aiText);
          } catch (err) {
            aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
            parsed = JSON.parse(aiText);
          }

          if (parsed && typeof parsed === 'object') {
            aiUsed = true;
            const grade = parsed.grade || parsed;
            scoreFraction = typeof grade.scoreFraction === 'number' ? Math.max(0, Math.min(1, grade.scoreFraction)) : scoreFraction;
            testsPassed = Number(grade.testsPassed || testsPassed || 0);
            totalTests = Number(grade.totalTests || totalTests || (Array.isArray(c.testCases) ? c.testCases.length : 0));
            aiExplanation = grade.explanation || null;
            aiHint = grade.hint || null;
            aiRecommendHint = !!grade.recommendHint || Boolean(grade.hint);

            const generated = parsed.officialAnswer || parsed.official_answer || parsed.answer || null;
            if (generated) {
              officialAnswer = generated;
              aiGeneratedAnswer = true;
            }
            console.log('[AI Eval] Successfully parsed AI response, scoreFraction:', scoreFraction);
          }
        } catch (parseErr) {
          console.warn('[AI Eval] Parse failed:', parseErr.message);
          note = 'AI evaluation returned invalid format. Please try again.';
        }
      }
    } catch (aiErr) {
      console.error('[AI Eval] AI call failed:', aiErr.message || aiErr);
      note = 'AI evaluation failed: ' + (aiErr.message || 'Unknown error');
    }
  }

  if (!aiUsed) {
    if (Array.isArray(c.testCases) && c.testCases.length > 0 && submittedText) {
      totalTests = c.testCases.length;
      c.testCases.forEach(tc => {
        const expected = (tc.output || '').toString().trim().toLowerCase();
        if (!expected) return;
        if (submittedText.toLowerCase().includes(expected)) testsPassed++;
      });

      scoreFraction = totalTests > 0 ? (testsPassed / totalTests) : 0;
      note = testsPassed === totalTests ? 'All test cases passed' : `Passed ${testsPassed}/${totalTests} test cases`;
    } else if (c.expected && typeof c.expected === 'string' && submittedText) {
      const matched = submittedText.toLowerCase().includes(c.expected.toLowerCase());
      scoreFraction = matched ? 1 : 0;
      note = matched ? 'Matched expected output' : 'Submission received; did not match expected pattern';
      if (!officialAnswer) officialAnswer = c.expected;
    } else if (officialAnswer && submittedText) {
      const { aiMatch, aiMatchScore } = compareAnswers(officialAnswer, submittedText);
      scoreFraction = aiMatch ? 1 : 0;
      note = aiMatch ? 'Matched official answer' : 'Submission received; did not match official answer';
    } else if (submittedText && !note) {
      // AI was supposed to run but failed - show that instead of generic message
      if (forceGenerateOfficial && aiEvalEnabled) {
        note = 'AI evaluation failed. Please check server logs or try again later.';
      } else if (!aiEvalEnabled) {
        note = 'AI evaluation is not configured on the server. Enable ENABLE_AI_EVAL and set OPENAI_API_KEY.';
      } else {
        note = 'Submission received (no validation data available)';
      }
    }
  } else {
    note = aiExplanation || aiHint || note;
  }

  // If no canonical answer exists on the challenge, optionally generate one via AI (disabled by default)
  try {
    if (ALLOW_OFFICIAL_GENERATION_ON_SUBMIT && (forceGenerateOfficial || (!officialAnswer && !c.expected && (!Array.isArray(c.testCases) || c.testCases.length === 0))) && process.env.ENABLE_AI_EVAL === 'true' && process.env.OPENAI_API_KEY) {
      const genPrompt = {
        instruction: "You are a concise technical assistant. Given a challenge title and description, produce a short canonical answer or solution suitable for showing as an official answer. Return only the answer text.",
        challenge: {
          title: c.title || '',
          description: c.description || ''
        }
      };

      const genRes = await openAICaller(() => getClient().chat.completions.create({
        model: process.env.AI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: JSON.stringify(genPrompt) }],
        temperature: 0.0
      }));

      const genText = genRes?.choices?.[0]?.message?.content?.trim();
      if (genText) {
        // Store locally in result only if generation explicitly allowed. Do not expose in response.
        officialAnswer = genText;
        aiGeneratedAnswer = true;
      }
    }
  } catch (err) {
    console.warn('AI generate official answer failed:', err?.message || err);
  }

  // Compare submission to officialAnswer if we have one
  let aiMatch = false;
  let aiMatchScore = 0;
  try {
    if (officialAnswer && submittedText) {
      const normalizeText = (s) => s.toString().trim().toLowerCase().replace(/\s+/g, ' ');
      const normalizeCode = (s) => s.toString().replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, '').replace(/[;]+/g, '');

      const isCodeLike = (str) => /\b(function|def|=>|console\.|\{|\}|\(|\)|\[|\]|;|import |from )/i.test(str) || str.split('\n').length > 3;

      let a = officialAnswer;
      let b = submittedText;
      if (isCodeLike(a) || isCodeLike(b)) {
        a = normalizeCode(a);
        b = normalizeCode(b);
      } else {
        a = normalizeText(a);
        b = normalizeText(b);
      }

      const levenshtein = (u, v) => {
        const m = u.length, n = v.length;
        const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;
        for (let i = 1; i <= m; i++) {
          for (let j = 1; j <= n; j++) {
            const cost = u[i - 1] === v[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
          }
        }
        return dp[m][n];
      };

      const dist = levenshtein(a, b);
      const maxLen = Math.max(a.length, b.length) || 1;
      aiMatchScore = Math.max(0, 1 - dist / maxLen);
      aiMatch = aiMatchScore >= 0.85 || a === b; // exact match or >=85% similarity
    }
  } catch (cmpErr) {
    console.warn('Compare error:', cmpErr?.message || cmpErr);
  }

  return {
    scoreFraction: Number(scoreFraction.toFixed(3)),
    testsPassed: testsPassed || 0,
    totalTests: totalTests || 0,
    isCorrect: scoreFraction > 0,
    correctness: (scoreFraction >= 1 ? 'correct' : (scoreFraction > 0 ? 'partially correct' : 'incorrect')),
    explanation: note || c.hint || (Array.isArray(c.hints) ? c.hints[0] : '') || '',
    officialAnswer,
    aiGeneratedAnswer,
    aiUsed,
    aiHint: aiHint || null,
    aiExplanation: aiExplanation || null,
    aiRecommendHint: aiRecommendHint || false,
    aiMatch,
    aiMatchScore
  };
};

/* ----------------------------------------------------
   GENERATE MISSION (OPENAI)
---------------------------------------------------- */
exports.generateMission = async (req, res) => {
  try {
    const { topic, difficulty, type, format } = req.body;

    if (!topic || !difficulty || !type)
      return res.status(400).json({ message: "Missing fields" });

    const prompt = buildMissionPrompt(topic, type, difficulty, format);

    console.log("\n[AI PROMPT SENT] =====================\n");
    console.log(prompt);

    let content;
    let usedFallback = false;
    try {
      const aiRes = await openAICaller(() => getClient().chat.completions.create({
        model: process.env.AI_MODEL || 'gpt-4o-mini',
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      }));

      let text = aiRes.choices[0].message.content.trim();

      console.log("\n[AI RAW RESPONSE] =====================\n");
      console.log(text);

      try {
        content = JSON.parse(text);
      } catch (err) {
        console.warn("\n[AI JSON PARSE FAILED] – trying fallback fix...\n");
        try {
          text = text.replace(/```json/g, "").replace(/```/g, "");
          content = JSON.parse(text);
        } catch (err2) {
          console.error("JSON parse failed after cleanup. Raw:", text);
          throw new Error("Invalid JSON from AI");
        }
      }
    } catch (aiErr) {
      // On repeated failures or rate-limits, fallback to mock mission generation
      usedFallback = true;
      console.warn("\n[OPENAI ERROR] - Using mock mission fallback =====================\n");
      console.warn("OpenAI error (final):", aiErr.message || aiErr);
      content = generateMockMission(topic, difficulty, type);
      console.log("Using mock mission:", content.title);
    }

    // Sanitize mission title: strip stray 'mcq' / 'multiple choice' tokens and clean punctuation
    const sanitizeTitle = (t) => {
      if (!t || typeof t !== 'string') return t;
      let s = t.replace(/\bmcq\b/ig, '').replace(/\bmultiple choice\b/ig, '').replace(/\s{2,}/g, ' ');
      // Remove leading/trailing hyphens/colons/slashes left by templates
      s = s.replace(/^[-:—\s]+/, '').replace(/[-:—\s]+$/, '').trim();
      return s || (type === 'mcq' ? 'MCQ Mission' : 'Mission');
    };

    const cleanedTitle = sanitizeTitle(content.title);

    // Sanitize topic and description so we don't store 'mcq' as the topic or repeat token
    const sanitizeTopic = (t) => {
      if (!t) return 'Security';
      let s = t.toString().replace(/\bmcq\b/ig, '').replace(/\bmultiple choice\b/ig, '').replace(/\s{2,}/g, ' ').trim();
      if (!s) s = 'Security';
      return s;
    };

    const sanitizeDescription = (d) => {
      if (!d) return d;
      return d.toString().replace(/\bmcq\b/ig, '').replace(/\bmultiple choice\b/ig, 'multiple-choice').replace(/\s{2,}/g, ' ').trim();
    };

    const savedTopic = sanitizeTopic(topic);
    const cleanedDescription = sanitizeDescription(content.description);

    const mission = await Mission.create({
      title: cleanedTitle,
      description: cleanedDescription,
      difficulty,
      type,
      topic: savedTopic,
      points: content.points || calculatePoints(difficulty),
      content: {
        questions: content.content?.questions || [],
        scenarios: content.content?.scenarios || [],
        challenges: content.content?.challenges || []
      },
      createdBy: req.user._id
    });

    console.log("\n[MISSION SAVED SUCCESSFULLY]\n");
    // include an informational flag to indicate the mission used AI or mock fallback
    const missionObj = mission.toObject();
    if (usedFallback) missionObj.aiFallback = true;
    res.status(201).json(missionObj);

  } catch (err) {
    console.error("\n[GENERATE MISSION ERROR] =====================\n", err);
    res.status(500).json({ message: "AI generation failed", error: err.message });
  }
};

/* ----------------------------------------------------
   GET MISSIONS WITH USER PROGRESS
---------------------------------------------------- */
exports.getUserMissions = async (req, res) => {
  try {
    const missions = await Mission.find().sort({ createdAt: -1 });

    // Get user's progress
    let progress = await Progress.findOne({ userId: req.user._id });
    if (!progress) {
      progress = await Progress.create({ userId: req.user._id });
    }

    // Map missions with user progress and strip correctSolution from challenges
    const missionsWithProgress = missions.map(mission => {
      const missionObj = mission.toObject();
      const missionProgress = progress.missions.find(m => m.missionId.toString() === mission._id.toString());

      // Strip correctSolution and expected from challenges before sending to user
      if (missionObj.content && Array.isArray(missionObj.content.challenges)) {
        missionObj.content.challenges = missionObj.content.challenges.map(c => {
          const { correctSolution, expected, officialAnswer, ...safeChallenge } = c;
          return safeChallenge;
        });
      }

      // Strip from MCQs
      if (missionObj.content && Array.isArray(missionObj.content.questions)) {
        missionObj.content.questions = missionObj.content.questions.map(q => {
          const { answer, explanation, correctIndex, ...safeQuestion } = q;
          return safeQuestion;
        });
      }

      // Strip from Scenarios
      if (missionObj.content && Array.isArray(missionObj.content.scenarios)) {
        missionObj.content.scenarios = missionObj.content.scenarios.map(s => {
          const { answer, explanation, correctIndex, ...safeScenario } = s;
          return safeScenario;
        });
      }

      return {
        ...missionObj,
        userProgress: missionProgress || { status: "not-started", score: 0, answers: [] }
      };
    });

    res.json(missionsWithProgress);
  } catch (err) {
    res.status(500).json({ message: "Failed to load missions" });
  }
};

/* ----------------------------------------------------
   GET MISSIONS (LEGACY)
---------------------------------------------------- */
exports.getMissions = async (req, res) => {
  try {
    const missions = await Mission.find().sort({ createdAt: -1 });
    res.json(missions);
  } catch (err) {
    res.status(500).json({ message: "Failed to load missions" });
  }
};

/* ----------------------------------------------------
   GET MISSION BY ID WITH PROGRESS
---------------------------------------------------- */
exports.getMissionById = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);
    if (!mission) return res.status(404).json({ message: "Mission not found" });

    // Get or create user progress
    let progress = await Progress.findOne({ userId: req.user._id });
    if (!progress) {
      progress = await Progress.create({ userId: req.user._id });
    }

    // Find or create mission progress
    let missionProgress = progress.missions.find(m => m.missionId.toString() === req.params.id);
    if (!missionProgress) {
      missionProgress = {
        missionId: mission._id,
        status: "in-progress",
        answers: [],
        startedAt: new Date()
      };
      progress.missions.push(missionProgress);
      await progress.save();
    } else if (missionProgress.status === "not-started") {
      // Update status to in-progress
      missionProgress.status = "in-progress";
      missionProgress.startedAt = new Date();
      await progress.save();
    }

    // Strip correctSolution and expected from challenges before sending to user
    // Also strip answer and explanation from questions and scenarios to prevent cheating
    const missionObj = mission.toObject();

    // Strip from Challenges
    if (missionObj.content && Array.isArray(missionObj.content.challenges)) {
      missionObj.content.challenges = missionObj.content.challenges.map(c => {
        const { correctSolution, expected, officialAnswer, ...safeChallenge } = c;
        return safeChallenge;
      });
    }

    // Strip from MCQs
    if (missionObj.content && Array.isArray(missionObj.content.questions)) {
      missionObj.content.questions = missionObj.content.questions.map(q => {
        const { answer, explanation, correctIndex, ...safeQuestion } = q;
        return safeQuestion;
      });
    }

    // Strip from Scenarios
    if (missionObj.content && Array.isArray(missionObj.content.scenarios)) {
      missionObj.content.scenarios = missionObj.content.scenarios.map(s => {
        const { answer, explanation, correctIndex, ...safeScenario } = s;
        return safeScenario;
      });
    }

    res.json({
      ...missionObj,
      userProgress: missionProgress
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load mission" });
  }
};

/* ----------------------------------------------------
   SUBMIT MISSION
---------------------------------------------------- */
exports.submitMission = async (req, res) => {
  try {
    const { missionId, answers = [], challengeSolutions = {} } = req.body;

    // Validation: missionId required
    if (!missionId) {
      return res.status(400).json({ message: "Mission ID is required" });
    }

    // Validation: answers must be an array
    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: "Answers must be an array" });
    }

    const mission = await Mission.findById(missionId);
    if (!mission) return res.status(404).json({ message: "Mission not found" });

    const questions = mission.content?.questions || [];

    // Validation: validate question and scenario answers indices
    const scenarios = mission.content?.scenarios || [];
    if (answers.length > 0) {
      for (let i = 0; i < answers.length; i++) {
        const answer = answers[i];

        // Skip undefined answers (unanswered questions or scenarios)
        if (answer === undefined || answer === null) continue;

        // Answer must be a number
        if (typeof answer !== 'number') {
          return res.status(400).json({
            message: `Answer at index ${i} must be a number or undefined`
          });
        }

        // Determine if this index maps to a question or a scenario
        if (i < questions.length) {
          // Question index
          const question = questions[i];
          if (!question) {
            return res.status(400).json({
              message: `Answer provided for non-existent question at index ${i}`
            });
          }
          const optionCount = question.options?.length || 0;
          if (answer < 0 || answer >= optionCount) {
            return res.status(400).json({
              message: `Answer at index ${i} must be between 0 and ${optionCount - 1}`
            });
          }
        } else {
          // Scenario index
          const scenarioIdx = i - questions.length;
          const scenario = scenarios[scenarioIdx];
          if (!scenario) {
            return res.status(400).json({
              message: `Answer provided for non-existent scenario at index ${scenarioIdx}`
            });
          }
          const optionCount = scenario.options?.length || 0;
          if (answer < 0 || answer >= optionCount) {
            return res.status(400).json({
              message: `Answer at index ${i} (scenario ${scenarioIdx}) must be between 0 and ${optionCount - 1}`
            });
          }
        }
      }
    }

    let gainedXP = mission.points;
    const answerDetails = [];

    // MCQ scoring with validation
    let totalItems = 0;
    let correctCount = 0;

    if (questions.length > 0) {
      let correct = 0;
      questions.forEach((q, index) => {
        const userAnswer = answers[index];
        const isCorrect = userAnswer !== undefined && userAnswer === q.answer;

        if (isCorrect) correct++;

        answerDetails.push({
          type: 'question',
          index: index,
          question: q.question,
          userAnswer: userAnswer !== undefined ? q.options[userAnswer] : "Not answered",
          correctAnswer: q.options[q.answer],
          isCorrect: isCorrect,
          explanation: q.explanation || "Good question!",
          topic: mission.topic
        });
      });

      totalItems += questions.length;
      correctCount += correct;
    }

    // Scenario evaluation (email-style decision questions)
    // Only process scenarios if they have actual answers submitted
    if (scenarios.length > 0) {
      let hasScenarioAnswers = false;
      scenarios.forEach((s, i) => {
        const answerIndex = questions.length + i;
        const userAnswer = answers[answerIndex];
        if (typeof userAnswer === 'number') hasScenarioAnswers = true;
      });

      if (hasScenarioAnswers) {
        scenarios.forEach((s, i) => {
          const answerIndex = questions.length + i;
          const userAnswer = answers[answerIndex];
          const isAnswered = typeof userAnswer === 'number';
          const isCorrect = isAnswered && userAnswer === s.answer;

          // Count all scenarios towards correctCount; unanswered = wrong
          if (isCorrect) correctCount++;

          answerDetails.push({
            type: 'scenario',
            index: i,
            title: s.title || `Scenario ${i + 1}`,
            sender: s.sender,
            subject: s.subject,
            content: s.content,
            userAnswer: isAnswered ? (s.options && s.options[userAnswer]) : 'Not answered',
            correctAnswer: s.options && s.options[s.answer],
            isCorrect: isCorrect,
            explanation: s.explanation || '',
            topic: mission.topic
          });
        });

        totalItems += scenarios.length;
      }
    }

    // Challenges evaluation (auto-check + testcases) - compute fractional score per challenge
    // Only process challenges if they have actual solutions submitted
    const challenges = mission.content?.challenges || [];
    if (challenges.length > 0 && challengeSolutions && Object.keys(challengeSolutions).length > 0) {
      let missionUpdatedForOfficial = false;
      for (let idx = 0; idx < challenges.length; idx++) {
        const c = challenges[idx];
        const submittedRaw = challengeSolutions && (challengeSolutions[idx] || challengeSolutions[String(idx)]);
        const submittedText = submittedRaw ? (typeof submittedRaw === 'string' ? submittedRaw.trim() : (submittedRaw.code || '').toString().trim()) : '';

        // Only evaluate if there's actual submission for this challenge
        if (!submittedText) continue;

        // Evaluate submission (AI if enabled, otherwise deterministic fallback)
        const evalResult = await evaluateSubmission(c, submittedText, { forceGenerateOfficial: !!req.body.force });

        // Persist AI-generated official answer into mission if present and not already set
        if (evalResult.aiGeneratedAnswer && evalResult.officialAnswer) {
          try {
            // Do not overwrite existing expected or officialAnswer unless empty
            if (!c.expected && !c.officialAnswer) {
              mission.content = mission.content || {};
              mission.content.challenges = mission.content.challenges || [];
              mission.content.challenges[idx] = mission.content.challenges[idx] || {};
              mission.content.challenges[idx].officialAnswer = evalResult.officialAnswer;
              mission.content.challenges[idx].officialAnswerGeneratedBy = 'ai';
              mission.content.challenges[idx].officialAnswerGeneratedAt = new Date();
              missionUpdatedForOfficial = true;
            }
          } catch (err) {
            console.warn('Failed to persist official answer for mission', mission._id, 'challenge', idx, err?.message || err);
          }
        }

        // Count partial credit towards correctCount as fractional value
        correctCount += evalResult.scoreFraction;

        answerDetails.push({
          type: 'challenge',
          index: idx,
          title: c.title || `Challenge ${idx + 1}`,
          description: c.description,
          submitted: submittedText || null,
          isCorrect: evalResult.isCorrect,
          correctness: evalResult.correctness || (evalResult.isCorrect ? 'correct' : (evalResult.scoreFraction > 0 ? 'partially correct' : 'incorrect')),
          scoreFraction: evalResult.scoreFraction,
          testsPassed: evalResult.testsPassed,
          totalTests: evalResult.totalTests,
          maxScore: 1,
          explanation: evalResult.explanation,
          aiUsed: evalResult.aiUsed,
          aiHint: evalResult.aiHint,
          aiExplanation: evalResult.aiExplanation,
          aiRecommendHint: evalResult.aiRecommendHint,
          topic: mission.topic
        });

        // treat each challenge as one item for scoring purposes (same as questions/scenarios)
        totalItems += 1;
      }

      // If we added AI-generated official answers, persist mission
      if (missionUpdatedForOfficial) {
        try {
          await mission.save();
          console.log('Persisted AI-generated official answers for mission', mission._id);
        } catch (err) {
          console.warn('Failed to save mission with generated answers', mission._id, err?.message || err);
        }
      }
    }

    // If there are items across questions/scenarios/challenges, score proportionally
    if (totalItems > 0) {
      const ratio = correctCount / totalItems;
      gainedXP = Math.round((mission.points || gainedXP) * ratio);
    } else {
      // Fallback: if there were no questions/scenarios/challenges, keep full points
      gainedXP = mission.points || gainedXP;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.score += gainedXP;
    user.level = Math.floor(user.score / 1000) + 1;

    // Track mission in history
    user.history.push({
      missionId: mission._id,
      score: gainedXP,
      difficulty: mission.difficulty
    });

    await user.save();

    // Update progress status (merge per-section progress without wiping other sections)
    let progress = await Progress.findOne({ userId: req.user._id });
    if (!progress) {
      progress = await Progress.create({ userId: req.user._id });
    }

    const missionProgressIndex = progress.missions.findIndex(m => m.missionId.toString() === missionId);

    const hasQuestions = questions.length > 0;
    const hasScenarios = scenarios.length > 0;
    const hasChallenges = challenges.length > 0;

    const existingProgress = missionProgressIndex >= 0 ? progress.missions[missionProgressIndex] : null;
    const existingAnswers = (existingProgress && Array.isArray(existingProgress.answers)) ? existingProgress.answers : [];
    const existingChallengeSolutions = existingProgress?.challengeSolutions || {};
    const existingSubmissionTrack = existingProgress?.submissionTrack || {};

    // Merge answers: keep previous section answers unless new submission provides a value
    const maxLen = Math.max(existingAnswers.length, answers.length, questions.length + scenarios.length);
    const mergedAnswers = Array.from({ length: maxLen }, (_, i) => {
      const incoming = answers[i];
      const existing = existingAnswers[i];
      return (incoming === null || incoming === undefined) ? existing : incoming;
    });

    // Merge challenge solutions: new submission overrides specific indices, otherwise keep prior
    const mergedChallengeSolutions = { ...existingChallengeSolutions };
    Object.keys(challengeSolutions || {}).forEach(k => {
      mergedChallengeSolutions[k] = challengeSolutions[k];
    });

    // Determine submission flags from merged data
    const questionsSubmitted = hasQuestions && mergedAnswers.slice(0, questions.length).some(a => a !== null && a !== undefined);
    const scenariosSubmitted = hasScenarios && mergedAnswers.slice(questions.length, questions.length + scenarios.length).some(a => a !== null && a !== undefined);
    const challengesSubmitted = hasChallenges && Object.keys(mergedChallengeSolutions).length > 0;

    const submissionTrack = {
      questionsSubmitted: existingSubmissionTrack.questionsSubmitted || questionsSubmitted,
      scenariosSubmitted: existingSubmissionTrack.scenariosSubmitted || scenariosSubmitted,
      challengesSubmitted: existingSubmissionTrack.challengesSubmitted || challengesSubmitted
    };

    // Determine overall mission status: only "completed" if all existing sections have been submitted
    const allSectionsSubmitted =
      (!hasQuestions || submissionTrack.questionsSubmitted) &&
      (!hasScenarios || submissionTrack.scenariosSubmitted) &&
      (!hasChallenges || submissionTrack.challengesSubmitted);

    const missionStatus = allSectionsSubmitted ? "completed" : "in-progress";

    if (missionProgressIndex >= 0) {
      progress.missions[missionProgressIndex].status = missionStatus;
      progress.missions[missionProgressIndex].answers = mergedAnswers;
      progress.missions[missionProgressIndex].challengeSolutions = mergedChallengeSolutions;
      progress.missions[missionProgressIndex].submissionTrack = submissionTrack;
      progress.missions[missionProgressIndex].score = gainedXP;
      if (missionStatus === "completed") {
        progress.missions[missionProgressIndex].completedAt = new Date();
      }
    } else {
      progress.missions.push({
        missionId: mission._id,
        status: missionStatus,
        answers: mergedAnswers,
        challengeSolutions: mergedChallengeSolutions,
        submissionTrack,
        score: gainedXP,
        startedAt: new Date(),
        completedAt: missionStatus === "completed" ? new Date() : null
      });
    }
    progress.lastPlayed = new Date();
    await progress.save();

    res.json({
      message: "Mission processed",
      gained: gainedXP,
      totalScore: user.score,
      level: user.level,
      answerDetails: answerDetails,
      missionTopic: mission.topic,
      submissionTrack,
      status: missionStatus
    });

  } catch (err) {
    console.error("Submit error:", err);
    res.status(500).json({ message: "Failed to submit mission", error: err.message });
  }
};

/* ----------------------------------------------------
   EVALUATE SINGLE CHALLENGE (AI or Deterministic)
---------------------------------------------------- */
exports.evaluateChallenge = async (req, res) => {
  try {
    const { missionId, challengeIndex, submission } = req.body;
    if (!missionId) return res.status(400).json({ message: 'Mission ID is required' });
    if (challengeIndex === undefined || challengeIndex === null) return res.status(400).json({ message: 'Challenge index is required' });

    const mission = await Mission.findById(missionId);
    if (!mission) return res.status(404).json({ message: 'Mission not found' });

    const challenges = mission.content?.challenges || [];
    const idx = Number(challengeIndex);
    if (isNaN(idx) || idx < 0 || idx >= challenges.length) return res.status(400).json({ message: 'Invalid challenge index' });

    const c = challenges[idx];
    const submittedText = submission ? (typeof submission === 'string' ? submission.trim() : (submission.code || '').toString().trim()) : '';

    // If caller requested forced AI generation/evaluation but AI is not configured, return 503 so client can inform user
    if (req.body.force && !(process.env.ENABLE_AI_EVAL === 'true' && process.env.OPENAI_API_KEY)) {
      return res.status(503).json({ message: 'AI evaluation not available on server. Ensure ENABLE_AI_EVAL=true and OPENAI_API_KEY is set.' });
    }

    const evalResult = await evaluateSubmission(c, submittedText, { forceGenerateOfficial: !!req.body.force });

    // If AI generated official answer and challenge lacks one, persist it to the mission
    if (evalResult.aiGeneratedAnswer && evalResult.officialAnswer) {
      try {
        if (!c.expected && !c.officialAnswer) {
          mission.content = mission.content || {};
          mission.content.challenges = mission.content.challenges || [];
          mission.content.challenges[idx] = mission.content.challenges[idx] || {};
          mission.content.challenges[idx].officialAnswer = evalResult.officialAnswer;
          mission.content.challenges[idx].officialAnswerGeneratedBy = 'ai';
          mission.content.challenges[idx].officialAnswerGeneratedAt = new Date();
          await mission.save();
          console.log('Persisted AI-generated official answer for mission', mission._id, 'challenge', idx);
        }
      } catch (err) {
        console.warn('Failed to persist AI-generated official answer', err?.message || err);
      }
    }

    res.json({ message: 'Evaluation complete', result: evalResult });
  } catch (err) {
    console.error('Evaluate challenge error:', err);
    res.status(500).json({ message: 'Failed to evaluate challenge', error: err.message });
  }
};

// Export evaluateSubmission for reuse and tests
exports.evaluateSubmission = evaluateSubmission;

/* ----------------------------------------------------
   AUTOSAVE MISSION PROGRESS (DRAFT)
---------------------------------------------------- */
exports.autosaveProgress = async (req, res) => {
  try {
    const { missionId, answers = [], challengeSolutions = {} } = req.body;
    if (!missionId) return res.status(400).json({ message: 'Mission ID is required' });

    const mission = await Mission.findById(missionId);
    if (!mission) return res.status(404).json({ message: 'Mission not found' });

    let progress = await Progress.findOne({ userId: req.user._id });
    if (!progress) {
      progress = await Progress.create({ userId: req.user._id, missions: [] });
    }

    let missionProgress = progress.missions.find(m => m.missionId.toString() === missionId);
    if (!missionProgress) {
      missionProgress = {
        missionId: mission._id,
        status: 'in-progress',
        answers: answers,
        challengeSolutions: challengeSolutions || {},
        startedAt: new Date()
      };
      progress.missions.push(missionProgress);
    } else {
      // Do not overwrite completed progress
      if (missionProgress.status !== 'completed') missionProgress.status = 'in-progress';
      missionProgress.answers = answers;
      missionProgress.challengeSolutions = challengeSolutions || {};
      if (!missionProgress.startedAt) missionProgress.startedAt = new Date();
    }

    progress.lastPlayed = new Date();
    await progress.save();

    const updatedEntry = progress.missions.find(m => m.missionId.toString() === missionId);
    res.json({ message: 'Autosaved', mission: mission.toObject(), missionProgress: updatedEntry });
  } catch (err) {
    console.error('Autosave error:', err);
    res.status(500).json({ message: 'Failed to autosave', error: err.message });
  }
};

/* ----------------------------------------------------
   COMPLETE GENERIC MISSION
---------------------------------------------------- */
exports.completeMission = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);
    if (!mission)
      return res.status(404).json({ message: "Mission not found" });

    const user = await User.findById(req.user._id);

    const earned = mission.points || 100;

    user.score += earned;
    user.level = Math.floor(user.score / 1000) + 1;
    await user.save();

    res.json({
      message: "Mission completed",
      earnedPoints: earned,
      newScore: user.score,
      newLevel: user.level
    });

  } catch (err) {
    console.error("Complete error:", err);
    res.status(500).json({ message: "Failed to complete mission" });
  }
};

/* ----------------------------------------------------
   VALIDATE MISSION SECTION (MCQ/SCENARIO)
---------------------------------------------------- */
exports.validateSection = async (req, res) => {
  try {
    const { missionId, type, answers } = req.body;
    // type: 'questions' or 'scenarios'
    // answers: { 0: 1, 1: 0, ... } or { 'sc-0': 1, ... } mapping index to selected option

    if (!missionId || !type) return res.status(400).json({ message: "Missing required fields" });

    const mission = await Mission.findById(missionId);
    if (!mission) return res.status(404).json({ message: "Mission not found" });

    let results = [];
    if (type === 'questions') {
      const questions = mission.content?.questions || [];
      results = questions.map((q, index) => {
        const userAns = answers[index];
        const isCorrect = userAns !== undefined && userAns === q.answer;
        return {
          index,
          isCorrect,
          correctAnswer: q.answer,
          explanation: q.explanation || 'Correct answer provided.'
        };
      });
    } else if (type === 'scenarios') {
      const scenarios = mission.content?.scenarios || [];
      results = scenarios.map((s, index) => {
        const userAnsKey = answers[`sc-${index}`] !== undefined ? `sc-${index}` : index;
        const userAns = answers[userAnsKey] !== undefined ? answers[userAnsKey] : answers[index]; // Handle both key formats
        const isCorrect = userAns !== undefined && userAns === s.answer;
        return {
          index,
          isCorrect,
          correctAnswer: s.answer,
          explanation: s.explanation || 'Correct option.'
        };
      });
    }

    res.json({ results });
  } catch (err) {
    console.error('Validate section error:', err);
    res.status(500).json({ message: "Validation failed" });
  }
};
