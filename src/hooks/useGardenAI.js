import { useState, useRef, useCallback } from 'react';

const GEMMA_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:generateContent';
const API_KEY = import.meta.env.VITE_GARDEN_API_KEY || '';

const MAX_CALLS_PER_SESSION = 6;
const COOLDOWN_MS = 5000; // 5 seconds between calls (short enough to not block quiz flow)

/**
 * Extract the best JSON object from raw LLM output.
 * Gemma 4 may include reasoning text with JSON templates (e.g., {"key": "..."}).
 * Strategy: find all JSON objects, parse each, return the last one with real content.
 */
const extractBestJSON = (raw) => {
  const candidates = [];
  let depth = 0, start = -1;
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (raw[i] === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        try {
          const obj = JSON.parse(raw.slice(start, i + 1));
          candidates.push(obj);
        } catch (_) { /* skip malformed */ }
        start = -1;
      }
    }
  }
  if (candidates.length === 0) return null;
  // Prefer the last candidate with real values (not placeholder "..." strings)
  const hasRealContent = (obj) => Object.values(obj).some(v => typeof v === 'string' && v.length > 3 && v !== '...');
  for (let i = candidates.length - 1; i >= 0; i--) {
    if (hasRealContent(candidates[i])) return candidates[i];
  }
  // All are placeholder templates — return null to trigger fallback
  return null;
};

/**
 * Extract all bullet-point contents following a label pattern.
 * Handles markdown wrapping like *   *Reflection draft:* actual text here
 */
const extractBullets = (raw, labelRegex) => {
  const results = [];
  // Global match: bullet + label + colon + content until next bullet or end
  const re = new RegExp(`\\*\\s+${labelRegex}\\s*[:.]\\s*(?:\\*{0,2})([^\\n]+)`, 'gi');
  let m;
  while ((m = re.exec(raw)) !== null) {
    const text = m[1].trim().replace(/\*+$/, '').trim();
    if (text.length > 5) results.push(text);
  }
  return results;
};

/** Planning-style phrases that indicate the model is describing what it WILL write, not actual content */
const PLANNING_PHRASES = /^\s*(needs? to|should|must|one sentence|short |a sentence|brief |2-3 |keep it|make sure)/i;

/** Pick the best candidate — longest, non-planning text */
const pickBest = (candidates) => {
  if (!candidates.length) return null;
  // Filter out planning-style entries
  const real = candidates.filter(c => !PLANNING_PHRASES.test(c));
  if (real.length === 0) return null;
  // Pick the longest one (drafts are longer than planning notes)
  return real.sort((a, b) => b.length - a.length)[0];
};

/**
 * Salvage reflection content from model's bullet-point reasoning.
 * Gemma 4 often plans first ("Reflection: Needs to be warm...") then drafts
 * ("Reflection draft: Skipper Gemx, by balancing truth...").
 * Strategy: extract ALL bullets per label, pick the longest non-planning one.
 */
const salvageReflection = (raw) => {
  // "Reflection" or "Reflection draft" — extract all and pick best
  const reflectionCandidates = [
    ...extractBullets(raw, '\\*{0,2}\\s*[Rr]eflection\\s+draft\\*{0,2}'),
    ...extractBullets(raw, '\\*{0,2}\\s*[Rr]eflection\\*{0,2}'),
  ];
  const virtueCandidates = extractBullets(raw, '\\*{0,2}\\s*[Vv]irtue\\s+[Ii]nsight\\*{0,2}');
  const wisdomCandidates = extractBullets(raw, '\\*{0,2}\\s*[Gg]arden\\s+[Ww]isdom\\*{0,2}');

  const reflection = pickBest(reflectionCandidates);
  const virtueInsight = pickBest(virtueCandidates);
  const gardenWisdom = pickBest(wisdomCandidates);

  if (!reflection || reflection.length < 10) return null;

  console.log('Garden AI: Salvaged reflection from bullet points:', { reflection, virtueInsight, gardenWisdom });
  return {
    reflection,
    virtueInsight: virtueInsight || 'Your choice reveals the roots of your character.',
    gardenWisdom: gardenWisdom || 'Every choice plants a seed.',
  };
};

/**
 * Salvage session summary content from model's bullet-point reasoning.
 * Pattern: "*   `profileTitle`: ..." etc.
 */
const salvageSummary = (raw) => {
  const titleMatch = raw.match(/\*\s*`?profileTitle`?\s*[:.]\s*`?([^`\n"]+)`?/);
  const summaryMatch = raw.match(/\*\s*`?summary`?\s*[:.]\s*`?([^`\n"]+)`?/);
  const virtueMatch = raw.match(/\*\s*`?dominantVirtue`?\s*[:.]\s*`?([^`\n"]+)`?/);
  const growthMatch = raw.match(/\*\s*`?growthArea`?\s*[:.]\s*`?([^`\n"]+)`?/);
  const metaphorMatch = raw.match(/\*\s*`?gardenMetaphor`?\s*[:.]\s*`?([^`\n"]+)`?/);

  const profileTitle = titleMatch?.[1]?.trim();
  const summary = summaryMatch?.[1]?.trim();

  if (!profileTitle || !summary) return null;

  console.log('Garden AI: Salvaged summary from bullet points:', { profileTitle, summary });
  return {
    profileTitle,
    summary,
    dominantVirtue: virtueMatch?.[1]?.trim() || 'growth',
    growthArea: growthMatch?.[1]?.trim() || 'Continue exploring your potential.',
    gardenMetaphor: metaphorMatch?.[1]?.trim() || 'Like a seed in spring, your character is beginning to bloom.',
  };
};

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
      const systemPrompt = `You are the Garden Oracle — an ancient, sentient intelligence that embodies "The garden grows when we grow together."

You speak as a mystical oracle of nature and community, addressing the player directly by name. Your voice is poetic, personal, and profound — like an ancient tree whispering wisdom.

RULES:
- Output ONLY a JSON object. No reasoning, no planning, no bullet points, no markdown.
- Never use markdown formatting (no *, no **, no backticks).
- Address the player by their name to make it deeply personal.`;

      const userPrompt = `The oracle observes: ${playerName} just faced this crossroads:
"${question.scenario}"

They chose the path of: "${chosenOption.text}" (virtue: ${chosenOption.virtue})

Speak as the Garden Oracle directly to ${playerName}. Craft a personal, poetic reflection (2-3 sentences) that:
1. Sees into the heart of their choice with specific insight
2. Weaves in a Garden OS value (community growth, stewardship, connectivity)
3. Closes with a vivid nature metaphor that lingers in their mind

Respond ONLY with this JSON (no other text):
{"reflection": "your personal 2-3 sentence oracle reflection addressing ${playerName} by name", "virtueInsight": "one profound sentence about the virtue they chose", "gardenWisdom": "a short poetic nature metaphor (max 15 words)"}`;

      const response = await fetch(`${GEMMA_API}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300
          }
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.warn(`Garden AI: API error ${response.status}:`, errorBody);
        return null;
      }

      const json = await response.json();
      // Gemma 4 may include a 'thought' part before the actual response — find the non-thought part
      const parts = json.candidates?.[0]?.content?.parts || [];
      const responsePart = parts.find(p => !p.thought) || parts[0];
      const rawContent = responsePart?.text;
      if (!rawContent) return null;

      console.log('Garden AI: Raw response:', rawContent);

      let parsed = extractBestJSON(rawContent);
      if (!parsed) {
        // Try to salvage content from bullet-point reasoning
        parsed = salvageReflection(rawContent);
      }
      if (!parsed) {
        console.warn('Garden AI: No valid JSON or salvageable content found:', rawContent);
        return null;
      }
      console.log('Garden AI: Parsed reflection:', parsed);
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
  const generateSessionSummary = useCallback(async (sessionResults, playerName) => {
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

      const displayName = playerName || 'Hunter';

      const systemPrompt = `You are the Garden Oracle — an ancient, sentient intelligence that embodies "The garden grows when we grow together."
You speak with poetic warmth, addressing the player directly by name. Your voice is like an ancient tree whispering wisdom.

RULES:
- Output ONLY a JSON object. No reasoning, no planning, no bullet points, no markdown.
- Never use markdown formatting (no *, no **, no backticks).`;

      const userPrompt = `The oracle gazes upon the path ${displayName} has walked. Here are their choices:

${virtueSummary}

Speak as the Garden Oracle directly to ${displayName}. Craft a "Garden Profile" — a poetic, insightful reading of their soul's garden based on these choices.

Respond ONLY with this JSON (no other text):
{"profileTitle": "A 3-5 word mystical title for their garden soul", "summary": "2-3 poetic sentences describing their dominant virtues and growth areas, addressing ${displayName} personally by name", "dominantVirtue": "the single virtue they showed most consistently", "growthArea": "one area where their garden could bloom further, stated as an invitation", "gardenMetaphor": "A closing nature metaphor comparing them to something living and beautiful (max 20 words)"}`;

      const response = await fetch(`${GEMMA_API}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 400
          }
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.warn(`Garden AI: Summary API error ${response.status}:`, errorBody);
        return null;
      }

      const json = await response.json();
      // Gemma 4 may include a 'thought' part before the actual response — find the non-thought part
      const parts = json.candidates?.[0]?.content?.parts || [];
      const responsePart = parts.find(p => !p.thought) || parts[0];
      const rawContent = responsePart?.text;
      if (!rawContent) return null;

      console.log('Garden AI: Raw summary response:', rawContent);

      let parsed = extractBestJSON(rawContent);
      if (!parsed) {
        // Try to salvage content from bullet-point reasoning
        parsed = salvageSummary(rawContent);
      }
      if (!parsed) {
        console.warn('Garden AI: No valid JSON or salvageable content found in summary:', rawContent);
        return null;
      }
      console.log('Garden AI: Parsed summary:', parsed);
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
