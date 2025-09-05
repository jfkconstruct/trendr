# Analyzer — Hooks / Structure / “Why it Worked” (MVP)

> Runs after transcripts are available. Produces labeled hooks, a structure outline, and evidence‑based reasons. Writes to `analyses` and returns a compact `why_worked` summary for Library cards.

## 0) Table (SQL)

```sql
create table if not exists public.analyses (
  id uuid primary key default uuid_generate_v4(),
  reference_id uuid not null references public.references(id) on delete cascade,
  hooks jsonb not null default '[]'::jsonb,        -- e.g., [{type:'Pattern interrupt', line:'...'}]
  structure jsonb not null default '{}'::jsonb,    -- e.g., { stages:[{name:'Hook', t:0},{name:'Proof', t:9}] }
  reasons jsonb not null default '{}'::jsonb,      -- e.g., { bullets:["..."], evidence:["quote"] }
  scores jsonb not null default '{}'::jsonb,       -- e.g., { hook_clarity:0.82, pacing:0.7 }
  created_at timestamptz default now()
);
```

---

## 1) Schema + Heuristics (`/lib/analyzer.ts`)

```ts
import { z } from 'zod';
import { chatJson, extractJsonCandidate } from '@/lib/llm';

export const Hook = z.object({ type: z.string(), line: z.string().optional() });
export const Stage = z.object({ name: z.string(), t: z.number().optional() });
export const AnalysisSchema = z.object({
  hooks: z.array(Hook).min(1),
  structure: z.object({ stages: z.array(Stage).min(2) }),
  reasons: z.object({ bullets: z.array(z.string()).min(2), evidence: z.array(z.string()).optional() }),
  scores: z.object({ hook_clarity:z.number().min(0).max(1).optional(), pacing:z.number().min(0).max(1).optional() }).partial(),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

// --- Quick heuristics on raw transcript ---
const HOOK_CUES = [/stop scrolling/i, /wait/i, /don'?t/i, /here'?s why/i, /the secret/i, /nobody/i, /you need to/i, /3 (?:ways|tips|reasons)/i, /what if/i];

function detectHooks(transcript: string){
  const first = transcript.split(/\n|\.\s+/).slice(0, 3).join(' ').slice(0, 240);
  const matches = HOOK_CUES.filter(rx=> rx.test(first));
  const type = matches.length ? 'Pattern interrupt' : /\?/.test(first) ? 'Curiosity gap' : /\d+/.test(first) ? 'Listicle' : 'Direct promise';
  return [{ type, line:first.trim() }];
}

function segmentStructure(transcript: string){
  const sentences = transcript.split(/[.!?]\s+/).slice(0, 20);
  // naive: first 1–2 sentences = Hook; middle = Proof; last = CTA if contains verbs like sign, try, download
  const tail = sentences.slice(-2).join(' ');
  const ctaLike = /(sign up|link in bio|follow|download|try|book|call|visit)/i.test(tail);
  const stages = [ { name:'Hook', t:0 }, { name:'Setup', t:3 }, { name:'Proof', t:7 }, { name: ctaLike ? 'CTA':'Payoff', t:15 } ];
  return { stages };
}

function heuristicReasons(transcript: string){
  const bullets:string[] = [];
  const first = transcript.slice(0, 200);
  if(/\byou\b/i.test(first)) bullets.push('Direct address to viewer in first line');
  if(/\d+/.test(first)) bullets.push('Specific numbers create concrete expectation');
  if(/\?/.test(first)) bullets.push('Curiosity question early to open a loop');
  if(!bullets.length) bullets.push('Clear, concise hook within first 3–5 seconds');
  return { bullets, evidence:[first.trim()] };
}

export async function analyzeTranscript(reference: any, transcript: string): Promise<Analysis>{
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

  try{
    const raw = await chatJson(system, user);
    const jsonText = extractJsonCandidate(raw);
    const refined = AnalysisSchema.parse(JSON.parse(jsonText));
    // Merge, preferring refined
    return { ...base, ...refined };
  }catch{
    return base;
  }
}
```

---

## 2) API Route (`/app/api/analyze/route.ts`)

```ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { analyzeTranscript } from '@/lib/analyzer';

// Body: { referenceId }
export async function POST(req: Request){
  const { referenceId } = await req.json();
  if(!referenceId) return NextResponse.json({ error:'referenceId required' }, { status:400 });

  const sb = supabaseServer();
  const { data: ref, error: e1 } = await sb.from('references').select('*').eq('id', referenceId).single();
  if(e1 || !ref) return NextResponse.json({ error: e1?.message || 'reference not found' }, { status:404 });
  if(!ref.transcript || ref.transcript.length < 20) return NextResponse.json({ error:'transcript missing' }, { status:400 });

  const analysis = await analyzeTranscript(ref, ref.transcript);

  const { data: row, error: e2 } = await sb.from('analyses').insert({
    reference_id: referenceId,
    hooks: analysis.hooks,
    structure: analysis.structure,
    reasons: analysis.reasons,
    scores: analysis.scores,
  }).select('*').single();
  if(e2) return NextResponse.json({ error: e2.message }, { status:400 });

  // convenience: compact why_worked for cards
  const why_worked = { bullets: analysis.reasons.bullets };
  return NextResponse.json({ ok:true, analysis: row, why_worked });
}
```

---

## 3) Pipeline Wiring

- After `/api/ingest/transcript` succeeds, call `/api/analyze` with the `referenceId`.
    
- Store `why_worked` on the reference (optional) or join card data from `analyses`.
    
- Generator prompts can include `analysis.reasons.bullets` to improve fidelity.
    

---

## 4) UI Hook (optional)

```ts
// /lib/useAnalyze.ts
export async function analyze(referenceId: string){
  const res = await fetch('/api/analyze', { method:'POST', body: JSON.stringify({ referenceId }) });
  return res.json();
}
```

---

## 5) QA Checklist

-  Analyzer returns at least 1 hook label and ≥2 bullets for common transcripts.
    
-  Invalid/missing transcript returns a helpful error.
    
-  `analyses` row persists and joins correctly on Library cards.
    
-  LLM refinement respects JSON schema; fallback to heuristics works.