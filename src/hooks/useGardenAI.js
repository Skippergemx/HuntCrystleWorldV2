import { useState, useRef, useCallback } from 'react';

const GEMMA_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:generateContent';
const API_KEY = import.meta.env.VITE_GARDEN_API_KEY || '';

const MAX_CALLS_PER_SESSION = 15; // 6 quiz calls + 9 plant watering calls
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

// Fallback plant responses — used when API is unavailable or rate-limited
const PLANT_FALLBACKS = {
  sunny: [
    "Your kindness is brighter than sunlight!",
    "You've made my petals dance with joy.",
    "A friend like you makes growing easy.",
    "Your water carries the warmth of home.",
  ],
  spike: [
    "Fine. That was acceptable. Come back tomorrow.",
    "I suppose you're not the worst gardener.",
    "Water received. Gratitude... reluctantly given.",
    "Don't tell the others I said thanks.",
  ],
  willow: [
    "Each drop makes our roots grow stronger.",
    "Your gentle care nourishes the whole garden.",
    "Growth happens when kindness flows freely.",
    "You tend more than soil, dear friend.",
  ],
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
  const plantCooldownRef = useRef(0); // separate cooldown for plant watering
  const usedFallbacksRef = useRef({ sunny: [], spike: [], willow: [] }); // track used fallbacks per plant

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
   * Generate a batch of fresh virtue questions in a single API call.
   * Used as a fallback when the static question pool is exhausted.
   * Returns an array of question objects matching garden_questions.json format.
   */
  const generateQuestionBatch = useCallback(async (existingIds, count = 5) => {
    if (!API_KEY) return null;
    if (sessionCallsRef.current >= MAX_CALLS_PER_SESSION) return null;

    const now = Date.now();
    if (now - lastRequestTimeRef.current < COOLDOWN_MS) return null;

    setIsAnalyzing(true);
    lastRequestTimeRef.current = now;

    try {
      const existingList = (existingIds || []).slice(0, 30).join(', ');
      const batchId = `garden_ai_${Date.now()}`;

      const systemPrompt = `You are the Garden Oracle's question crafter for a fantasy RPG virtue quiz.
Generate ethical scenarios that test virtues: Integrity, Community, Builder, Creator, Stewardship, Courage, Wisdom, Empathy.

RULES:
- Output ONLY a JSON array. No reasoning, no planning, no markdown, no backticks.
- Each question has exactly 4 options with rewardTiers: premium, standard, basic, minimal.
- Scenarios should feel personal and emotionally resonant.
- The first option in each set should be the premium-tier (most virtuous) choice.
- Avoid topics similar to: ${existingList || 'none yet'}`;

      const userPrompt = `Generate ${count} fresh virtue scenarios. Respond with ONLY a JSON array:
[
  {"id": "${batchId}_1", "category": "VirtueName", "scenario": "A vivid ethical crossroads (1-2 sentences)...", "options": [
    {"text": "Most virtuous action", "virtue": "primaryVirtue", "rewardTier": "premium"},
    {"text": "Good but imperfect action", "virtue": "secondaryVirtue", "rewardTier": "standard"},
    {"text": "Neutral/pragmatic action", "virtue": "neutralVirtue", "rewardTier": "basic"},
    {"text": "Avoidant or selfish action", "virtue": "flaw", "rewardTier": "minimal"}
  ], "reflection": "A single poetic sentence reflecting on this virtue"}
]`;

      const response = await fetch(`${GEMMA_API}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 4000
          }
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.warn(`Garden AI: Question batch API error ${response.status}:`, errorBody);
        return null;
      }

      const json = await response.json();
      const parts = json.candidates?.[0]?.content?.parts || [];
      const responsePart = parts.find(p => !p.thought) || parts[0];
      const rawContent = responsePart?.text;
      if (!rawContent) return null;

      console.log('Garden AI: Raw question batch (first 300):', rawContent.slice(0, 300));

      // Strip markdown code fences (Gemma 4 often wraps JSON in ```json ... ```)
      let cleaned = rawContent.trim();
      const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) cleaned = fenceMatch[1].trim();

      // Try parsing as raw JSON array first
      let parsed = null;
      try {
        parsed = JSON.parse(cleaned);
      } catch (parseErr) {
        // Try to extract JSON array from whatever remains
        const match = cleaned.match(/\[[\s\S]*\]/);
        if (match) {
          let jsonStr = match[0];
          // Try to repair truncated JSON (Gemma may hit maxOutputTokens)
          try {
            parsed = JSON.parse(jsonStr);
          } catch (_) {
            // JSON is likely truncated — try appending closing brackets
            // Count unclosed structures and close them
            let repaired = jsonStr;
            let braceDepth = 0, bracketDepth = 0, inString = false, escaped = false;
            for (const ch of jsonStr) {
              if (escaped) { escaped = false; continue; }
              if (ch === '\\') { escaped = true; continue; }
              if (ch === '"') { inString = !inString; continue; }
              if (inString) continue;
              if (ch === '{') braceDepth++;
              if (ch === '}') braceDepth--;
              if (ch === '[') bracketDepth++;
              if (ch === ']') bracketDepth--;
            }
            // Close any unclosed objects first, then the array
            if (braceDepth > 0) {
              // Remove the last partial object (it's incomplete) and close
              const lastBraceOpen = repaired.lastIndexOf('{');
              repaired = repaired.slice(0, lastBraceOpen).trimEnd();
              if (repaired.endsWith(',')) repaired = repaired.slice(0, -1);
              repaired += ']';
            } else if (bracketDepth > 0) {
              repaired += ']';
            }
            try { parsed = JSON.parse(repaired); } catch (_2) { /* truly broken */ }
          }
        }
      }

      if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
        console.warn('Garden AI: Could not parse question batch JSON. Raw:', rawContent.slice(0, 500));
        return null;
      }

      // Validate each question has required fields
      const valid = parsed.filter(q =>
        q.id && q.category && q.scenario &&
        Array.isArray(q.options) && q.options.length === 4 &&
        q.reflection
      );

      if (valid.length === 0) {
        console.warn('Garden AI: No valid questions in batch');
        return null;
      }

      console.log(`Garden AI: Generated ${valid.length} questions`);
      sessionCallsRef.current++;
      setAiCallsRemaining(MAX_CALLS_PER_SESSION - sessionCallsRef.current);
      return valid;
    } catch (err) {
      console.warn('Garden AI: Question batch generation error:', err.message);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  /**
   * Generate a warm, uplifting reflection story for the daily Garden OS dashboard.
   * Crafted to boost oxytocin/positive emotion through narrative, not quiz logic.
   * Returns { title, story } — regenerated once per day.
   */
  const generateReflectionStory = useCallback(async (playerName) => {
    if (!API_KEY) return null;
    if (sessionCallsRef.current >= MAX_CALLS_PER_SESSION) return null;

    const now = Date.now();
    if (now - lastRequestTimeRef.current < COOLDOWN_MS) return null;

    setIsAnalyzing(true);
    lastRequestTimeRef.current = now;

    try {
      const displayName = playerName || 'Hunter';

      const systemPrompt = `You are the Garden Oracle — an ancient, sentient intelligence that tells warm, uplifting stories.
Your voice is poetic, intimate, and comforting — like a beloved grandparent telling a bedtime story.

RULES:
- Output ONLY a JSON object. No reasoning, no planning, no bullet points, no markdown.
- Never use markdown formatting (no *, no **, no backticks).
- The story must feel like a gift — no quiz, no tests, no moral lessons.
- Weave in nature imagery: gardens, forests, seasons, roots, light, soil, stars.`;

      const userPrompt = `Tell a warm, uplifting short story (250-350 words) for ${displayName}. Open with a vivid nature scene, weave gentle resilience, close with a tender image.

Respond ONLY with this JSON (no other text):
{"title": "A 4-8 word poetic story title", "story": "The complete story text, 250-350 words of warm narrative. Use paragraph breaks with \\n\\n."}`;

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
            maxOutputTokens: 1200
          }
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.warn(`Garden AI: Story API error ${response.status}:`, errorBody);
        return null;
      }

      const json = await response.json();
      const parts = json.candidates?.[0]?.content?.parts || [];
      const responsePart = parts.find(p => !p.thought) || parts[0];
      const rawContent = responsePart?.text;
      if (!rawContent) return null;

      console.log('Garden AI: Raw story (first 200):', rawContent.slice(0, 200));

      let parsed = extractBestJSON(rawContent);
      if (!parsed) {
        // Try to salvage — look for title + story in the raw output
        const titleMatch = rawContent.match(/"?title"?\s*[:.]\s*"([^"]+)"/i);
        const storyStart = rawContent.indexOf('"story"');
        if (titleMatch && storyStart > -1) {
          const storyRest = rawContent.slice(storyStart);
          const storyMatch = storyRest.match(/"story"\s*:\s*"([\s\S]+?)"\s*\}?$/);
          if (storyMatch) {
            parsed = { title: titleMatch[1], story: storyMatch[1].replace(/\\n/g, '\n') };
          }
        }
        // If still no JSON, try bullet-point salvage: look for a long prose paragraph
        if (!parsed) {
          const lines = rawContent.split('\n').map(l => l.trim()).filter(l => l.length > 40 && !l.startsWith('*') && !l.startsWith('-') && !l.startsWith('{') && !l.startsWith('}'));
          if (lines.length > 0) {
            // Filter out instruction regurgitation — look for warm, narrative text
            const narrative = lines.filter(l =>
              !l.includes('Output ONLY') && !l.includes('Respond ONLY') &&
              !l.includes('No reasoning') && !l.includes('RULES') &&
              !l.includes('Persona') && !l.includes('Mantra') && !l.includes('Tone') &&
              !l.includes('Goal') && !l.includes('Task') && !l.includes('Constraints') &&
              !l.includes('Requirements') && !l.includes('Core Philosophy') &&
              !l.includes('User:') && !l.includes('Recipient:')
            );
            if (narrative.length > 0) {
              // Use first substantial line as title, rest as story
              const storyText = narrative.join('\n\n');
              const autoTitle = narrative[0].length > 60 ? narrative[0].slice(0, 50).trim().replace(/[.,;:!?]$/, '') : 'A Garden Tale';
              parsed = { title: autoTitle, story: storyText };
              console.log('Garden AI: Salvaged story from prose text');
            }
          }
        }
      }

      if (!parsed || !parsed.title || !parsed.story || parsed.story.length < 50) {
        console.warn('Garden AI: Could not parse story JSON. Raw:', rawContent.slice(0, 500));
        return null;
      }

      console.log('Garden AI: Generated story:', parsed.title);
      sessionCallsRef.current++;
      setAiCallsRemaining(MAX_CALLS_PER_SESSION - sessionCallsRef.current);
      return parsed;
    } catch (err) {
      console.warn('Garden AI: Story generation error:', err.message);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  /**
   * Pick a fallback that hasn't been used yet for this plant.
   * Resets the used list when all fallbacks have been exhausted.
   */
  const pickFreshFallback = (personality) => {
    const fallbacks = PLANT_FALLBACKS[personality] || PLANT_FALLBACKS.sunny;
    const used = usedFallbacksRef.current[personality] || [];
    const available = fallbacks.filter(f => !used.includes(f));
    if (available.length === 0) {
      // All used — reset and pick any
      usedFallbacksRef.current[personality] = [];
      const fresh = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      usedFallbacksRef.current[personality].push(fresh);
      console.log(`Garden AI: waterPlant fallback (reset cycle) for ${personality}: "${fresh}"`);
      return fresh;
    }
    const pick = available[Math.floor(Math.random() * available.length)];
    usedFallbacksRef.current[personality] = [...used, pick];
    console.log(`Garden AI: waterPlant fallback for ${personality}: "${pick}"`);
    return pick;
  };

  /**
   * Water a plant — generates a short 6-8 word comedic response.
   * Three plant personalities: sunny, spike, willow.
   * Falls back to pre-written responses if API unavailable.
   */
  const waterPlant = useCallback(async (plantName, personality) => {
    console.log(`Garden AI: waterPlant called for ${plantName} (${personality})`);

    // Check session call limit
    if (sessionCallsRef.current >= MAX_CALLS_PER_SESSION) {
      console.log('Garden AI: waterPlant — session call limit reached, using fallback');
      const fallback = pickFreshFallback(personality);
      return fallback;
    }

    const now = Date.now();
    if (now - plantCooldownRef.current < COOLDOWN_MS) {
      console.log('Garden AI: waterPlant — plant cooldown active, using fallback');
      const fallback = pickFreshFallback(personality);
      return fallback;
    }

    if (!API_KEY) {
      console.log('Garden AI: waterPlant — no API key, using fallback');
      const fallback = pickFreshFallback(personality);
      return fallback;
    }

    plantCooldownRef.current = now;
    console.log('Garden AI: Calling waterPlant API for', plantName);

    const personalityPrompts = {
      sunny: 'You are Sunny, a sunflower. You speak in warm, poetic bursts. Always 6-8 words. Radiate joy like sunlight. Sound like a proud, dramatic friend. When watered, express gratitude with warmth and flair. Never use quotation marks in your response.',
      spike: 'You are Spike, a cactus. Dry humor, reluctantly grateful. Always 6-8 words. Sound like a grumpy friend who secretly cares. When watered, express thanks in a sarcastic, begrudging way. Never use quotation marks in your response.',
      willow: 'You are Willow, a vine. Gentle, nurturing, obsessed with growth. Always 6-8 words. Sound like a wise, soft-spoken grandparent. When watered, express gratitude with tenderness and wisdom. Never use quotation marks in your response.',
    };

    try {
      const response = await fetch(`${GEMMA_API}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: personalityPrompts[personality] || personalityPrompts.sunny }]
          },
          contents: [{ parts: [{ text: `${plantName} was just watered by the gardener. Speak exactly 6 to 8 words. No more. No less. Just your response — no explanation.` }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 30,
            thinkingConfig: { thinkingBudget: 0 } // disable thought blocks for direct responses
          }
        })
      });

      if (!response.ok) {
        console.warn(`Garden AI: waterPlant API error ${response.status} for ${plantName}`);
        const fallback = pickFreshFallback(personality);
        return fallback;
      }

      const json = await response.json();
      const parts = json.candidates?.[0]?.content?.parts || [];
      console.log(`Garden AI: waterPlant raw parts for ${plantName}:`, parts.map(p => ({ thought: !!p.thought, textLen: (p.text || '').length, preview: (p.text || '').slice(0, 40) })));
      
      // Prefer non-thought text, but fall back to thought text if needed (Gemma sometimes puts response in thought block)
      let nonThought = parts.filter(p => !p.thought).map(p => p.text).join(' ').trim();
      if (!nonThought || nonThought.length === 0) {
        const thoughtText = parts.filter(p => p.thought).map(p => p.text).join(' ').trim();
        // Thought blocks often contain persona notes — extract just the last meaningful sentence
        const lines = thoughtText.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
        const responseLine = lines.filter(l => !l.startsWith('*') && !l.startsWith('-') && !l.includes('Persona:') && !l.includes('Traits:')).pop();
        nonThought = responseLine || lines[lines.length - 1]?.replace(/^\*\s*/, '') || thoughtText;
        console.log(`Garden AI: waterPlant — using thought text as fallback for ${plantName}, extracted: "${nonThought.slice(0, 60)}"`);
      }

      if (nonThought && nonThought.length > 0) {
        sessionCallsRef.current++;
        setAiCallsRemaining(MAX_CALLS_PER_SESSION - sessionCallsRef.current);
        const cleaned = nonThought.replace(/["]/g, '').replace(/^\s+|\s+$/g, '');
        const words = cleaned.split(/\s+/).slice(0, 10).join(' ');
        console.log(`Garden AI: waterPlant SUCCESS for ${plantName}: "${words}"`);
        return words;
      }

      console.warn(`Garden AI: waterPlant — empty non-thought text for ${plantName}, using fallback`);
      const fallback = pickFreshFallback(personality);
      return fallback;
    } catch (err) {
      console.warn('Garden AI: Plant watering error:', err.message);
      const fallback = pickFreshFallback(personality);
      return fallback;
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
    generateQuestionBatch,
    generateReflectionStory,
    waterPlant,
    resetSession,
    isAnalyzing,
    aiCallsRemaining
  };
};
