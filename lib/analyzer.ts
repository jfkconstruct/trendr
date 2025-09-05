import { chatJson, extractJsonCandidate } from '@/lib/llm-client';

// Simplified analysis structure matching PRD
export interface Hook {
  type: string;
  line?: string;
}

export interface Stage {
  name: string;
  t?: number;
}

export interface Analysis {
  hooks: Hook[];
  structure: {
    stages: Stage[];
  };
  reasons: {
    bullets: string[];
    evidence?: string[];
  };
  scores: {
    hook_clarity?: number;
    pacing?: number;
  };
}

// --- Quick heuristics on raw transcript ---
const HOOK_CUES = [
  /stop scrolling/i, 
  /wait/i, 
  /don'?t/i, 
  /here'?s why/i, 
  /the secret/i, 
  /nobody/i, 
  /you need to/i, 
  /3 (?:ways|tips|reasons)/i, 
  /what if/i
];

function detectHooks(transcript: string): { type: string; line?: string }[] {
  const first = transcript.split(/\n|\.\s+/).slice(0, 3).join(' ').slice(0, 240);
  const matches = HOOK_CUES.filter(rx => rx.test(first));
  const type = matches.length ? 'Pattern interrupt' : /\?/.test(first) ? 'Curiosity gap' : /\d+/.test(first) ? 'Listicle' : 'Direct promise';
  return [{ type, line: first.trim() }];
}

function segmentStructure(transcript: string): { stages: { name: string; t?: number }[] } {
  const sentences = transcript.split(/[.!?]\s+/).slice(0, 20);
  // naive: first 1–2 sentences = Hook; middle = Proof; last = CTA if contains verbs like sign, try, download
  const tail = sentences.slice(-2).join(' ');
  const ctaLike = /(sign up|link in bio|follow|download|try|book|call|visit)/i.test(tail);
  const stages = [ 
    { name:'Hook', t:0 }, 
    { name:'Setup', t:3 }, 
    { name:'Proof', t:7 }, 
    { name: ctaLike ? 'CTA':'Payoff', t:15 } 
  ];
  return { stages };
}

function heuristicReasons(transcript: string): { bullets: string[]; evidence: string[] } {
  const bullets: string[] = [];
  const first = transcript.slice(0, 200);
  if(/\byou\b/i.test(first)) bullets.push('Direct address to viewer in first line');
  if(/\d+/.test(first)) bullets.push('Specific numbers create concrete expectation');
  if(/\?/.test(first)) bullets.push('Curiosity question early to open a loop');
  if(!bullets.length) bullets.push('Clear, concise hook within first 3–5 seconds');
  return { bullets, evidence:[first.trim()] };
}

/**
 * Analyze a transcript and return structured analysis
 * @param reference The reference object containing metadata
 * @param transcript The transcript text to analyze
 * @returns Structured analysis with hooks, structure, reasons, and scores
 */
export async function analyzeTranscript(reference: any, transcript: string): Promise<Analysis> {
  // Start with heuristics for speed
  const base: Analysis = {
    hooks: detectHooks(transcript),
    structure: segmentStructure(transcript),
    reasons: heuristicReasons(transcript),
    scores: { hook_clarity: 0.7, pacing: 0.6 }
  };

  // Optional: refine with LLM (kept deterministic, JSON output)
  const system = 'You label short-form videos. Output STRICT JSON with keys hooks, structure, reasons, scores.';
  const user = `Transcript:\n${transcript}\n\nReturn JSON: { hooks:[{type,line?}], structure:{stages:[{name,t?}]}, reasons:{bullets:[...] , evidence:[...]}, scores:{hook_clarity:0..1,pacing:0..1} }`;

  try {
    const raw = await chatJson(system, user);
    const jsonText = extractJsonCandidate(raw);
    // Parse the JSON response (we'll trust the LLM to return valid JSON)
    const refined = JSON.parse(jsonText);
    // Merge, preferring refined
    return { ...base, ...refined };
  } catch {
    return base;
  }
}
