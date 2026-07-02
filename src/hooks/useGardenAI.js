import { useState, useRef, useCallback } from 'react';

const GEMMA_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:generateContent';
const API_KEY = import.meta.env.VITE_GARDEN_API_KEY || '';

const MAX_CALLS_PER_SESSION = 15; // 6 quiz calls + 9 plant watering calls
const COOLDOWN_MS = 5000; // 5 seconds between calls (short enough to not block quiz flow)
const DAILY_HINT_COOLDOWN_MS = 30000; // 30s between daily hint calls (independent of garden session)

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
    "You shower me with love, dear gardener!",
    "My leaves are singing because of you.",
    "Every drop you give me radiates pure joy.",
    "The sun itself envies your warm heart.",
    "You turn ordinary water into golden kindness.",
    "I bloom brighter just knowing you're here.",
    "Your care paints the garden in joy.",
    "Standing tall because you believed in me.",
    "You're the sunshine after every rain, friend.",
    "My golden petals are blushing with gratitude.",
    "Thank you for making the world more beautiful.",
  ],
  spike: [
    "Fine. That was acceptable. Come back tomorrow.",
    "I suppose you're not the worst gardener.",
    "Water received. Gratitude... reluctantly given.",
    "Don't tell the others I said thanks.",
    "You're tolerable. For a human, anyway.",
    "I've had worse caretakers. Much worse.",
    "Alright, that hit the spot. Barely.",
    "You remembered I exist. How thoughtful.",
    "If I had feelings, they'd be appreciative.",
    "Not bad. I'll hold off the prickles today.",
    "You earn one cactus-point. Don't spend it.",
    "Surprisingly competent watering technique.",
    "Fine, fine. You're growing on me.",
    "I won't jab you today. You earned it.",
    "Grudging respect earned. Don't let it go.",
  ],
  willow: [
    "Each drop makes our roots grow stronger.",
    "Your gentle care nourishes the whole garden.",
    "Growth happens when kindness flows freely.",
    "You tend more than soil, dear friend.",
    "Patience and water — the oldest wisdom of all.",
    "Your hands carry the memory of rain.",
    "In your care, even stone would bloom.",
    "The garden whispers thanks through every leaf.",
    "You water not just roots, but spirits.",
    "Slow and steady, like the vine we grow.",
    "Kindness planted here will reach the sky.",
    "You understand what roots truly need, friend.",
    "Every watering is a promise of tomorrow.",
    "The earth remembers every gentle hand.",
    "Together we weave a tapestry of green.",
  ],
};

// Fallback gemstone stories — rotated deterministically by day when API is unavailable
const DAILY_HINT_FALLBACKS = [
  "An old gem-cutter in Crystle Town found a gem that weeps at midnight. He claimed it remembers the hands that mined it — a thousand years of longing, trapped in amber light.",
  "A young hunter discovered a violet gem inside a slain beast. It pulsed with warmth, and that night, she dreamed of a mountain that had never been climbed.",
  "The scholar Elara spent years studying a single cracked gem. When it finally spoke, it revealed the location of a library buried beneath the dunes — its words written in dust and starlight.",
  "A wandering merchant traded his finest wares for a dull grey stone. The townsfolk laughed — until the stone began to glow with every lie spoken nearby. He never lost a deal again.",
  "Deep in the mines, a boy named Kael found a gem that hummed when danger approached. He became the youngest scout in the guild, guided by a song only he could hear.",
  "The gem-smith Mira forged a ring from a shattered star-stone. The wearer could see invisible threads binding all things — fate, they called it, but she called it responsibility.",
  "A thief stole a jewel from the town shrine and found it burned his skin. He returned it at dawn, and the gem forgave him — but the scar remained, a reminder etched in light.",
  "Two sisters found twin gems in a dried-up riverbed. Apart, the stones were cold. Together, they hummed in harmony, knitting a bond not even distance could break.",
  "The Oracle placed a gem in a young hunter's palm and said: 'This stone has cried for three centuries. Dry its tears, and it will show you the way home.'",
  "A gem discovered in the eastern quarry held a single frozen tear. Legend says it belongs to a guardian who wept when the first gem was mined from the earth.",
  "A farmer turned over a stone in his field and found a gem pulsing like a heart. He planted his crops around it, and that season, the harvest was legendary.",
  "The pirate queen Vexara wore a gem that could smell gold from a league away. She retired rich, but the stone grew quiet — it missed the thrill of the chase.",
  "A child traded her most beloved toy for a pebble that sparkled. Years later, she learned the pebble was a dragon's tooth-gem, and it had chosen her all along.",
  "The hermit of the northern ridge kept a single gem in his hut. Visitors said it whispered advice in a voice like crumbling stone. He never spoke, but the gem spoke for him.",
  "A warrior placed a gem in the hilt of his blade. Each enemy struck became transparent for a moment, revealing their hidden fears. He won battles without drawing blood.",
  "A gem found in the belly of a fish contained a miniature map. The ink was made of crushed starlight, and the destination shifted every time the moon rose.",
  "The queen of a fallen kingdom sealed her memories inside a gem. A wandering scholar found it and spent a lifetime watching a stranger's life unfold in dreams.",
  "A goblin trader bit a gem to test its worth and tasted honey. He kept it ever since, convinced it held the sweetness of a summer that never ended.",
  "A lonely gem sat at the bottom of a well for centuries, reflecting the moon every night. When a drought came, the village found the well was still full — of liquid light.",
  "The last gem-crafter of an ancient lineage held a stone that had not yet revealed its purpose. 'Patience,' he told it each morning. One day, it finally glowed.",
];

/**
 * Pick a deterministic fallback hint based on the current date.
 * Ensures variety day-to-day without needing the API.
 */
const getDailyFallbackHint = () => {
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  const hint = DAILY_HINT_FALLBACKS[dayOfYear % DAILY_HINT_FALLBACKS.length];
  return { hint };
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
  const dailyHintLastRequestRef = useRef(0); // independent cooldown for daily hint
  const plantCooldownRef = useRef(0); // separate cooldown for plant watering
  const usedFallbacksRef = useRef({ sunny: [], spike: [], willow: [] }); // track used fallbacks per plant
  const enrichmentPoolRef = useRef({}); // API responses that pass validation, served occasionally

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
    const pool = enrichmentPoolRef.current[personality] || [];
    
    // Occasionally serve from enrichment pool (30% chance if pool has items)
    if (pool.length > 0 && Math.random() < 0.3) {
      const poolPick = pool[Math.floor(Math.random() * pool.length)];
      console.log(`Garden AI: serving from enrichment pool for ${personality}: "${poolPick}"`);
      return poolPick;
    }
    
    const available = fallbacks.filter(f => !used.includes(f));
    if (available.length === 0) {
      // All used — reset and pick any
      usedFallbacksRef.current[personality] = [];
      const fresh = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      usedFallbacksRef.current[personality].push(fresh);
      console.log(`Garden AI: curated response (reset cycle) for ${personality}: "${fresh}"`);
      return fresh;
    }
    const pick = available[Math.floor(Math.random() * available.length)];
    usedFallbacksRef.current[personality] = [...used, pick];
    console.log(`Garden AI: curated response for ${personality}: "${pick}"`);
    return pick;
  };

  /**
   * Validate an API-generated response — must be actual dialogue, not template text, persona notes, or labels.
   */
  const isValidDialogue = (text) => {
    if (!text || text.length < 6) return false;
    // Reject template placeholders
    if (text.includes('[') || text.includes(']')) return false;
    // Reject persona/label echoes
    if (/^(Persona|Traits|Style|Tone|Voice|Role|Context|Task|Goal|Action|Response)\s*:/i.test(text)) return false;
    // Reject single-word nonsense
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount < 3 || wordCount > 15) return false;
    return true;
  };

  /**
   * Water a plant — always returns an immediate curated response.
   * API is called silently in the background to enrich the pool for future waterings.
   * Three plant personalities: sunny, spike, willow.
   */
  const waterPlant = useCallback(async (plantName, personality) => {
    console.log(`Garden AI: waterPlant called for ${plantName} (${personality})`);

    // Always pick a curated response immediately
    const curated = pickFreshFallback(personality);

    // Fire API in background to enrich pool (don't block the response)
    const now = Date.now();
    if (
      API_KEY &&
      sessionCallsRef.current < MAX_CALLS_PER_SESSION &&
      now - plantCooldownRef.current >= COOLDOWN_MS
    ) {
      plantCooldownRef.current = now;
      console.log('Garden AI: background API enrichment for', plantName);
      
      // Fire-and-forget — we don't await this
      (async () => {
        try {
          const personalityLabels = {
            sunny: 'a cheerful sunflower',
            spike: 'a sarcastic cactus',
            willow: 'a wise vine',
          };
          const resp = await fetch(`${GEMMA_API}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `You are ${plantName}, ${personalityLabels[personality] || personalityLabels.sunny}. A gardener just watered you. Say thank you in exactly 6 to 8 words.\n\nRespond in this format and nothing else:\nRESPONSE: [your 6-8 word gratitude]` }] }],
              generationConfig: { temperature: 0.9, maxOutputTokens: 100 }
            })
          });

          if (!resp.ok) return;
          const json = await resp.json();
          const parts = json.candidates?.[0]?.content?.parts || [];
          
          // Try RESPONSE: marker first, then non-thought text, then dialogue fragments
          const allText = parts.map(p => p.text).join(' ').trim();
          let extracted = parts.filter(p => !p.thought).map(p => p.text).join(' ').trim();
          
          if (!extracted) {
            const m = allText.match(/RESPONSE:\s*(.+?)(?:\n|$)/i);
            if (m && m[1].trim()) {
              extracted = m[1].trim();
            } else {
              const thoughtText = parts.filter(p => p.thought).map(p => p.text).join(' ').trim();
              const fragments = thoughtText.split(/[\n*]+/).map(s => s.trim()).filter(s => s.length > 0);
              const dialogue = fragments.filter(f => 
                f.length >= 10 && f.length <= 60 && 
                !/^[A-Z][a-z]+:/.test(f) &&
                !/^(Persona|Traits|Style|Tone|Voice|Role|Context|Task|Goal|Action|Response)$/i.test(f)
              );
              extracted = dialogue.pop() || '';
            }
          }

          if (isValidDialogue(extracted)) {
            sessionCallsRef.current++;
            setAiCallsRemaining(MAX_CALLS_PER_SESSION - sessionCallsRef.current);
            const cleaned = extracted.replace(/["]/g, '').trim();
            const words = cleaned.split(/\s+/).slice(0, 10).join(' ');
            // Add to enrichment pool
            if (!enrichmentPoolRef.current[personality]) enrichmentPoolRef.current[personality] = [];
            enrichmentPoolRef.current[personality].push(words);
            console.log(`Garden AI: enrichment pool added for ${personality}: "${words}" (pool size: ${enrichmentPoolRef.current[personality].length})`);
          }
        } catch (e) {
          // Silent fail — enrichment is best-effort
        }
      })();
    }

    return curated;
  }, []);

  /**
   * Generate a daily gemstone story for the main menu — a short tale about
   * characters and their connection to magical gemstones.
   * Uses its own cooldown, independent of Garden OS session limits.
   * Returns { hint: string } or null on failure.
   */
  const generateDailyHint = useCallback(async (playerName) => {
    if (!API_KEY) return getDailyFallbackHint();

    const now = Date.now();
    if (now - dailyHintLastRequestRef.current < DAILY_HINT_COOLDOWN_MS) return null;
    dailyHintLastRequestRef.current = now;

    try {
      const displayName = playerName || 'Hunter';

      const systemPrompt = `You are the Gemstone Chronicler — an ancient storyteller who narrates short tales about human characters and the magical gemstones of Dungeons With Gems.

RULES:
- Output ONLY a JSON object. No reasoning, no planning, no bullet points, no markdown.
- Never use markdown formatting (no *, no **, no backticks).
- Write a tale (5-8 sentences, 150-250 words) about a character and their connection to a gemstone.
- Make it immersive and vivid — a proper campfire story, not a summary.
- Include sensory details: how the gem feels, sounds, or glows.
- The character can be a hunter, a merchant, a scholar, a wanderer, or a gem-crafter.
- The gemstone can grant power, hold ancient memories, cause mischief, or reveal a secret.
- End with a sense of wonder, consequence, or discovery.
- Make it feel like a fireside tale — myth, legend, or folktale from the gem world.`;

      const userPrompt = `Write a gemstone tale (5-8 sentences, 150-250 words) for ${displayName} about a human character and a magical gemstone in the world of Dungeons With Gems. Make it vivid and immersive — a proper campfire story with sensory detail.

Respond ONLY with a raw JSON object. No markdown, no code fences, no other text. The JSON must have exactly one key: "hint".`;

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
            maxOutputTokens: 700
          }
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.warn('Daily Hint: API error', response.status, errorBody);
        return getDailyFallbackHint();
      }

      const json = await response.json();
      const parts = json.candidates?.[0]?.content?.parts || [];
      const responsePart = parts.find(p => !p.thought) || parts[0];
      const rawContent = responsePart?.text;
      if (!rawContent) return getDailyFallbackHint();

      console.log('Daily Hint: Raw (first 150):', rawContent.slice(0, 150));

      const parsed = extractBestJSON(rawContent);
      if (!parsed?.hint || parsed.hint.length < 10) return getDailyFallbackHint();

      return { hint: parsed.hint };
    } catch (e) {
      console.warn('Daily Hint: Generation failed:', e);
      return getDailyFallbackHint();
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
    generateDailyHint,
    waterPlant,
    resetSession,
    isAnalyzing,
    aiCallsRemaining
  };
};
