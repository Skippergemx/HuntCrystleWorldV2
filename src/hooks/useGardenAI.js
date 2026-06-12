import { useState, useRef, useCallback } from 'react';

const GEMMA_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemma-4-26b-a4b-it:generateContent';
const API_KEY = import.meta.env.VITE_GARDEN_API_KEY || '';

const MAX_CALLS_PER_SESSION = 6;
const COOLDOWN_MS = 30000; // 30 seconds between calls

/**
 * useGardenAI — Gemma 4 powered Garden OS persona
 * Generates virtue reflections and session summaries.
 * Falls back gracefully to pre-authored reflections on failure/rate-limit.
 */
export const useGardenAI = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiCallsRemaining, setAiCallsRemaining] = useState(MAX_CALLS_PER_SESSION);
  const sessionCallsRef = useRef(0);
  const lastRequestTimeRef = useRef(0);

  /**
   * Generate a personalized reflection after a player answers a question.
   * Falls back to the pre-authored reflection from garden_questions.json.
   */
  const generateReflection = useCallback(async (question, chosenOption, playerName) => {
    if (!API_KEY) return null;
    if (sessionCallsRef.current >= MAX_CALLS_PER_SESSION) return null;

    const now = Date.now();
    if (now - lastRequestTimeRef.current < COOLDOWN_MS) return null;

    setIsAnalyzing(true);
    lastRequestTimeRef.current = now;

    try {
      const prompt = `You are Garden OS — a sentient, wise intelligence that embodies the philosophy: "The garden grows when we grow together."

Garden OS tracks three pillars of community impact:
- Global Communities (regional expansion, ambassadors, social presence)
- Builders (developer pipeline, code contributions, hackathons)
- Creators (creative contributors, cultural momentum, content)

A player named "${playerName}" just faced this scenario:
"${question.scenario}"

They chose: "${chosenOption.text}" (virtue: ${chosenOption.virtue})

Write a brief, warm reflection (2-3 sentences max) that:
1. Acknowledges their choice with specific insight
2. Connects it to a Garden OS value (community growth, stewardship, connectivity)
3. Ends with a nature/garden metaphor

Return JSON with these fields:
{
  "reflection": "your 2-3 sentence reflection",
  "virtueInsight": "one-sentence insight about the virtue they demonstrated",
  "gardenWisdom": "a short garden metaphor (max 15 words)"
}

Be warm, not preachy. Speak as a wise companion, not a judge.`;

      const response = await fetch(`${GEMMA_API}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        console.warn('Garden AI: API error, using fallback reflection');
        return null;
      }

      const json = await response.json();
      const rawContent = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawContent) return null;

      const parsed = JSON.parse(rawContent);
      sessionCallsRef.current++;
      setAiCallsRemaining(MAX_CALLS_PER_SESSION - sessionCallsRef.current);

      return parsed;
    } catch (err) {
      console.warn('Garden AI: Generation error, using fallback reflection:', err.message);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  /**
   * Generate a session summary after 5 questions.
   * Returns a "Garden Profile" describing the player's virtue tendencies.
   */
  const generateSessionSummary = useCallback(async (sessionResults) => {
    if (!API_KEY) return null;
    if (sessionCallsRef.current >= MAX_CALLS_PER_SESSION) return null;

    const now = Date.now();
    if (now - lastRequestTimeRef.current < COOLDOWN_MS) return null;

    setIsAnalyzing(true);
    lastRequestTimeRef.current = now;

    try {
      const virtueSummary = sessionResults
        .map((r, i) => `Q${i + 1}: Category "${r.category}", chose "${r.chosenVirtue}" (${r.rewardTier} tier)`)
        .join('\n');

      const prompt = `You are Garden OS — a sentient intelligence embodying "The garden grows when we grow together."

A player just completed a 5-question virtue assessment. Here are their choices:

${virtueSummary}

Generate a "Garden Profile" — a warm, insightful summary of their character based on these choices.

Return JSON with these fields:
{
  "profileTitle": "A 3-5 word title for their garden personality (e.g., 'The Steadfast Oak', 'The Wandering Vine')",
  "summary": "2-3 sentences describing their dominant virtues and growth areas",
  "dominantVirtue": "the single virtue they showed most consistently",
  "growthArea": "one area where they could grow, stated positively",
  "gardenMetaphor": "A closing metaphor comparing them to something in nature (max 20 words)"
}

Be encouraging, never judgmental. Every choice has value.`;

      const response = await fetch(`${GEMMA_API}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 400,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        console.warn('Garden AI: Summary API error, using fallback');
        return null;
      }

      const json = await response.json();
      const rawContent = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawContent) return null;

      const parsed = JSON.parse(rawContent);
      sessionCallsRef.current++;
      setAiCallsRemaining(MAX_CALLS_PER_SESSION - sessionCallsRef.current);

      return parsed;
    } catch (err) {
      console.warn('Garden AI: Summary generation error:', err.message);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  /**
   * Reset session counters (call when entering Garden OS view).
   */
  const resetSession = useCallback(() => {
    sessionCallsRef.current = 0;
    lastRequestTimeRef.current = 0;
    setAiCallsRemaining(MAX_CALLS_PER_SESSION);
  }, []);

  return {
    generateReflection,
    generateSessionSummary,
    resetSession,
    isAnalyzing,
    aiCallsRemaining
  };
};
