# PRD — AI Content Agent Platform (Simplified MVP + App Flow + Code Stubs)

## 1) Summary

Deliver a lean web app MVP that (1) auto-discovers niche-specific viral content across platforms from a user-entered keyword, (2) explains _why_ each piece performed, and (3) generates editor-ready outputs (scripts, captions, beat sheets, b-roll plans, etc.). Designed for rapid iteration, minimal setup, and easy handoff to development agents.

## 2) Goals & Non-Goals

**Goals (MVP):**

- Enter a **niche keyword** → fetch top-performing content.
    
- Rank results by simple **viral score** (views/engagement per hour).
    
- Let users model references → generate complete editor packs.
    
- Provide exports as **zip bundles** or via **n8n/Drive**.
    
- Optional **11Labs VO** + auto-subtitles.
    

**Non-Goals:**

- Complex taxonomy/creator DBs.
    
- Finished rendered videos.
    
- Full multi-platform orchestration (beyond Shorts/Reels/TikTok MVP).
    

## 3) Target Users

- **Solo creators** wanting repeatable content engines.
    
- **Small agencies/editors** needing structured briefs.
    
- **Marketers/founders** aiming for viral-style content tied to offers.
    

## 4) Value Props

- **Type a niche → see hot content instantly.**
    
- Transparent “why it worked.”
    
- One-click generation of editor-ready briefs.
    
- From idea → export in ≤10 min.
    

## 5) User Stories

1. Enter “real estate” → see Top 10 Shorts/Reels/TikToks with metrics + reasons.
    
2. Click **Model** → attach Offer → hit **Generate**.
    
3. Receive script, captions, hashtags, beat sheet, b-roll plan, thumbnail brief.
    
4. Export as zip or send via webhook.
    

## 6) App Flow

```
Onboard → Create Project
   ↓
Select Platform → Enter Niche keyword
   ↓
Discovery auto-fetches Top 10–20 by viral score
   ↓
Viral Library: cards with metrics + why it worked
   ↓
Pick Reference → Attach Offer → Generate
   ↓
Outputs: Script + Captions + Hashtags + Beats + B-roll + Thumbnail
   ↓
Export (Zip / Drive / n8n)
```

## 7) Features

### 7.1 Discovery & Ranking

- **YouTube Shorts**: Data API `search.list` + `videos.list`.
    
- **IG Reels**: Hashtag Search API (limited quotas).
    
- **TikTok**: Watchlist-based.
    
    - User enters niche → system suggests creators/hashtags (cross-platform inference + LLM expander + seed CSV).
        
    - User confirms watchlist.
        
    - Scheduler polls items → ranks by `(likes+2×comments)/hours_since_post`.
        
- Return Top 10–20 references.
    

### 7.2 Analysis & Generation

- Transcript extraction (captions/ASR).
    
- Auto-label: hook type, structure, beats.
    
- Generate outputs:
    
    - Script with 3–5 hooks.
        
    - Captions & hashtags.
        
    - Beat sheet + b-roll plan.
        
    - Thumbnail brief.
        
    - Subtitles (.srt/.vtt).
        
    - Optional 11Labs VO.
        

### 7.3 Export

- Zip bundle: `script.txt`, `captions.txt`, `hashtags.txt`, `beats.json`, `broll.json`, `thumbnail.md`, `subtitles.srt`, optional `vo.mp3`.
    
- Send via **n8n webhook** or save to Drive.
    

### 7.4 TikTok Watchlists

- Data model:
    
    - `tiktok_watchlists(id, project_id, name, niche)`
        
    - `tiktok_watch_items(id, watchlist_id, item_type, handle, hashtag, source, enabled)`
        
- API routes:
    
    - `POST /api/tiktok/watchlists` → create.
        
    - `POST /api/tiktok/suggest` → suggest creators/hashtags.
        
    - `POST /api/tiktok/pull` → poll new refs.
        
- UX:
    
    - “Build Watchlist” suggests creators/hashtags.
        
    - Toggle items on/off.
        
    - Manual paste/CSV upload fallback.
        

## 8) Functional Requirements

- F1: Auto-discovery by keyword (YT/IG) or watchlist (TikTok).
    
- F2: Viral score ranking.
    
- F3: Analyze → label why it worked.
    
- F4: Generate editor-ready packs.
    
- F5: Export zip & webhook.
    

## 9) Non-Functional

- Latency ≤20s end-to-end.
    
- Uptime ≥99.5%.
    
- Cost ≤$0.30 per pack.
    

## 10) Data Model

- **Reference**(id, platform, url, creator, metrics, transcript, viral_score)
    
- **Analysis**(id, reference_id, hooks, structure, reasons)
    
- **OfferProfile**(id, icp_json, constraints_json)
    
- **GenerationJob**(id, reference_id, offer_id, status, outputs_json)
    
- **OutputPack**(id, job_id, files)
    
- **TikTokWatchlist** / **WatchItem** (as above)
    

## 11) AI Components

- Transcripts: captions/Whisper.
    
- Hook & structure: rule-based + LLM few-shot.
    
- “Why it worked”: heuristic template.
    
- Generation: LLM + platform-tuned templates.
    
- Suggestions: LLM + entity extraction from cross-platform refs.
    

### 11.1 Prompt Pack (Platform-Tuned)

```ts
// /lib/prompts.ts
export function promptYouTube(ref:any, offer:any){
  return `YT Shorts Pack → Script, Captions, Hashtags, Beats, B-roll, Thumbnail\nReference: ${ref.title}\nWhy it worked: ${JSON.stringify(ref.why_worked)}\nOffer: ${JSON.stringify(offer)}`;
}

export function promptInstagram(ref:any, offer:any){
  return `IG Reels Pack → Hook-first, high-energy captions, emoji-rich hashtags.\nReference: ${ref.title}\nWhy: ${JSON.stringify(ref.why_worked)}\nOffer: ${JSON.stringify(offer)}`;
}

export function promptTikTok(ref:any, offer:any){
  return `TikTok Pack → Bold hooks, fast cuts, Gen Z tone.\nReference: ${ref.title}\nWhy: ${JSON.stringify(ref.why_worked)}\nOffer: ${JSON.stringify(offer)}`;
}

// JSON schema contract
export const outputSchema = {
  type: 'object',
  required: ['script','captions','hashtags','beats','broll','thumbnail_brief','subtitles'],
  properties: {
    script: { type:'string' },
    captions: { type:'string' },
    hashtags: { type:'array', items:{ type:'string' } },
    beats: { type:'array', items:{ type:'object' } },
    broll: { type:'array', items:{ type:'object' } },
    thumbnail_brief: { type:'string' },
    subtitles: { type:'string' }
  }
};
```

### 11.2 JSON Output Validator

```ts
import Ajv from 'ajv';
import { outputSchema } from './prompts';

const ajv = new Ajv();
const validate = ajv.compile(outputSchema);

export function validatePack(json:any){
  const valid = validate(json);
  if(!valid){
    throw new Error('Invalid generation output: '+JSON.stringify(validate.errors));
  }
  return json;
}
```

## 12) Architecture

- **Frontend:** Next.js + Tailwind.
    
- **Backend:** Next.js API routes.
    
- **DB/Storage:** Supabase.
    
- **Workers:** Edge functions for generation + TikTok pulls.
    
- **Integrations:** YT Data API, IG Graph API, 11Labs, n8n, Drive.
    

### 12.1 Minimal UI Hooks

```tsx
// /components/useLibrary.ts
import { useState } from 'react';
import { discoverReferences } from '@/lib/api';

export function useLibrary(){
  const [items,setItems] = useState([]);
  const [loading,setLoading] = useState(false);

  async function discover(platform:string,niche:string){
    setLoading(true);
    const res = await discoverReferences({ platform, niche });
    setItems(res.items||[]);
    setLoading(false);
  }

  return { items, loading, discover };
}
```

```tsx
// /components/useWatchlists.ts
import { useState } from 'react';
import { createWatchlist, suggestWatchItems, pullTikTok } from '@/lib/api';

export function useWatchlists(){
  const [watchlists,setWatchlists] = useState<any[]>([]);

  async function create(projectId:string,niche:string){
    const res = await createWatchlist({ projectId, niche, items:[] });
    setWatchlists([...watchlists, { id:res.watchlistId, niche }]);
  }

  async function suggest(niche:string){
    return await suggestWatchItems({ niche });
  }

  async function pull(id:string){
    return await pullTikTok({ watchlistId:id });
  }

  return { watchlists, create, suggest, pull };
}
```

## 13) Acceptance Criteria

- Enter niche → ≥10 references auto-fetched & ranked.
    
- Ref cards show metrics + 2 “why it worked” bullets.
    
- Generate function outputs full editor pack ≤20s.
    
- Zip export + webhook fire correctly.
    
- TikTok watchlists can be created, suggested, and refreshed.
    

## 14) Phases

**Phase 0:** YT-only discovery; generator + exports. (1–2 wks)  
**Phase 1 (MVP):** Add IG hashtag + TikTok watchlists. (4–6 wks)  
**Phase 2:** Similarity search, boards, longform YT, stock providers.

---

# Developer Handoff Notes (for Cline agent)

- **Routes ready to scaffold:**
    
    - `/api/discover` (YT/IG)
        
    - `/api/tiktok/watchlists`, `/suggest`, `/pull`
        
    - `/api/generate`
        
    - `/api/exports`
        
- **Env vars:** `YOUTUBE_API_KEY`, `IG_ACCESS_TOKEN`, `IG_USER_ID`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ELEVENLABS_API_KEY`, `N8N_WEBHOOK_URL`.
    
- **Storage:** Supabase bucket `editor-packs/{project}/{pack}/...`.
    
- **Scheduler:** Cron or Supabase Edge Function to refresh TikTok watchlists daily.
    
- **LLM prompts:** deterministic, sectioned outputs with schema validation.
    
- **Fallbacks:** manual URL paste for TikTok if APIs/feeds unavailable.
    

---

# Prompt Pack (Platform‑Tuned) + JSON Output Validator

> Deterministic prompts that force structure + a JSON schema validator to keep outputs consumable.

## `/lib/prompts.ts`

```ts
export type Offer = { problem:string; promise:string; proof:string; pitch:string };

// Shared helper so all platform prompts stay consistent
export const SYSTEM = `You are a senior content strategist and scriptwriter.
You MUST output strictly valid JSON, matching the provided JSON schema (no extra keys).`;

// Base keys we always expect (keep stable for the UI/zip/exporter)
export const OUTPUT_KEYS = [
  'script','captions','hashtags','beats','broll','thumbnail_brief','subtitles'
] as const;

// Platform adapters
const PLATFORM_HINTS: Record<string, string> = {
  shorts: `Format for YouTube Shorts (≤60s). 1:1 or 9:16 framing. Hook in ≤3s.
Keep spoken lines short. Include on‑screen text cues in [TEXT] brackets.`,
  reels: `Format for Instagram Reels (≤60s). Emphasize visual transitions;
front‑load novelty. Keep copy friendly and hashtag list compact (≤8).`,
  tiktok: `Format for TikTok (≤60s). Pattern interrupt in first 2s.
Use rhythmic phrasing; avoid platform‑ban phrases. Use 3–6 focused hashtags.`
};

// Prompt factory
export function makePrompt(platform: 'shorts'|'reels'|'tiktok', reference:any, offer:Offer){
  const hints = PLATFORM_HINTS[platform];
  const why = JSON.stringify(reference?.why_worked||{}, null, 2);
  return `TASK: Create a platform‑native content pack.
PLATFORM: ${platform.toUpperCase()}
GUIDELINES:
${hints}

REFERENCE_INSIGHTS:
${why}

OFFER (4Ps):
Problem: ${offer.problem}
Promise: ${offer.promise}
Proof: ${offer.proof}
Pitch: ${offer.pitch}

STRICT JSON KEYS: ${OUTPUT_KEYS.join(', ')}

Constraints:
- Script: include HOOK first, then Setup, Proof, Payoff, CTA. Mark on‑screen text as [TEXT: ...].
- Captions: 1–2 sentences, end with CTA.
- Hashtags: array of 4–8 strings, lowercase, no spaces (use camel or snake), niche‑specific.
- Beats: array of { t:number(seconds), beat:string } entries.
- Broll: array of { t:number, cue:string } entries.
- Thumbnail_brief: 1–2 lines, concrete visual guidance.
- Subtitles: valid SRT content.
`;
}
```

## `/lib/validator.ts` (Zod schema + safe parser)

```ts
import { z } from 'zod';

export const Beat = z.object({ t: z.number().min(0), beat: z.string().min(1) });
export const BRoll = z.object({ t: z.number().min(0), cue: z.string().min(1) });

export const PackSchema = z.object({
  script: z.string().min(10),
  captions: z.string().min(5),
  hashtags: z.array(z.string().regex(/^#[a-z0-9_]+$/i)).min(3).max(12),
  beats: z.array(Beat).min(3),
  broll: z.array(BRoll).min(2),
  thumbnail_brief: z.string().min(5),
  subtitles: z.string().min(10),
});

export type Pack = z.infer<typeof PackSchema>;

export function parsePack(jsonText: string){
  let parsed: unknown;
  try { parsed = JSON.parse(jsonText); } catch (e) {
    throw new Error('LLM output was not valid JSON');
  }
  const res = PackSchema.safeParse(parsed);
  if(!res.success){
    const issues = res.error.errors.map(e=> `${e.path.join('.')}: ${e.message}`).join('; ');
    throw new Error(`Pack schema validation failed: ${issues}`);
  }
  return res.data;
}
```

## `/app/api/generate/route.ts` (wired with prompt + validator)

```ts
import { NextResponse } from 'next/server';
import { makePrompt, SYSTEM } from '@/lib/prompts';
import { parsePack } from '@/lib/validator';

// Replace with your LLM call
async function callLLM(system: string, user: string){
  // Example adapter; integrate with your provider (OpenAI, Anthropic, etc.)
  // Must return raw JSON text per our schema
  return JSON.stringify({
    script: 'HOOK → Setup → Proof → Payoff → CTA',
    captions: 'Own your mortgage plan. Start smart today → link in bio.',
    hashtags: ['#realestate','#homebuyertips','#mortgage101','#firsttimebuyer'],
    beats: [{t:0,beat:'Hook'},{t:4,beat:'Setup'},{t:9,beat:'Proof'},{t:14,beat:'Payoff'},{t:19,beat:'CTA'}],
    broll: [{t:0,cue:'Fast push‑in on host'},{t:5,cue:'Overlay rate chart'}],
    thumbnail_brief: 'Face close‑up + big text: “Avoid This Loan Mistake”',
    subtitles: '1
00:00:00,000 --> 00:00:02,000
Avoid this loan mistake!
'
  });
}

export async function POST(req: Request){
  const { platform, reference, offer } = await req.json();
  const prompt = makePrompt(platform, reference, offer);
  const raw = await callLLM(SYSTEM, prompt);
  const pack = parsePack(raw); // throws if invalid
  return NextResponse.json(pack);
}
```

---

# Minimal UI Hooks (Library + Watchlists)

## `/lib/useDiscovery.ts` — fetch Top N for a niche

```ts
import { useEffect, useState } from 'react';

type Platform = 'shorts'|'reels';
export function useDiscovery(platform: Platform, niche: string){
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|undefined>();

  useEffect(()=>{
    let ignore=false;
    if(!niche) return;
    (async()=>{
      try{
        setLoading(true); setError(undefined);
        const res = await fetch('/api/discover', { method:'POST', body: JSON.stringify({ platform, niche }) });
        const json = await res.json();
        if(!ignore) setItems(json.items||[]);
      }catch(e:any){ if(!ignore) setError(e?.message||'Failed'); }
      finally{ if(!ignore) setLoading(false); }
    })();
    return ()=>{ ignore=true; };
  }, [platform, niche]);

  return { items, loading, error };
}
```

## `/lib/useWatchlist.ts` — create/suggest/pull helpers

```ts
export async function createWatchlist(projectId:string, niche:string, name?:string, items:any[]=[]){
  const res = await fetch('/api/tiktok/watchlists', { method:'POST', body: JSON.stringify({ projectId, niche, name, items }) });
  return res.json();
}

export async function suggestWatchItems(niche:string, fromYouTubeRefs:any[]=[], fromInstagramRefs:any[]=[]){
  const res = await fetch('/api/tiktok/suggest', { method:'POST', body: JSON.stringify({ niche, fromYouTubeRefs, fromInstagramRefs }) });
  return res.json();
}

export async function pullWatchlist(watchlistId:string, entries:any[]=[]){
  const res = await fetch('/api/tiktok/pull', { method:'POST', body: JSON.stringify({ watchlistId, entries }) });
  return res.json();
}
```

## Library Page snippet (wiring the hook)

```tsx
// app/(dashboard)/library/page.tsx
'use client';
import { useState } from 'react';
import { useDiscovery } from '@/lib/useDiscovery';

export default function Library(){
  const [platform, setPlatform] = useState<'shorts'|'reels'>('shorts');
  const [niche, setNiche] = useState('real estate');
  const { items, loading } = useDiscovery(platform, niche);

  return (
    <div className="p-6 space-y-4">
      <div className="flex gap-2">
        <select className="border rounded-xl p-2" value={platform} onChange={e=>setPlatform(e.target.value as any)}>
          <option value="shorts">YouTube Shorts</option>
          <option value="reels">Instagram Reels</option>
        </select>
        <input className="border rounded-xl p-2 w-80" value={niche} onChange={e=>setNiche(e.target.value)} placeholder="Enter niche…"/>
      </div>
      {loading ? <div>Loading…</div> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((r:any)=> (
            <div key={r.id} className="rounded-2xl border p-4">
              <div className="text-xs uppercase opacity-60">{r.platform}</div>
              <a className="font-semibold block line-clamp-2" href={r.url} target="_blank" rel="noreferrer">{r.title}</a>
              <div className="text-sm opacity-80">{r.creator}</div>
              <ul className="mt-2 list-disc list-inside text-sm">
                {(r.why_worked?.bullets||[]).slice(0,2).map((b:string, i:number)=> <li key={i}>{b}</li>)}
              </ul>
              <button className="mt-3 rounded-xl border px-3 py-1 text-sm">Model</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Watchlists Page snippet (build + suggest)

```tsx
// app/(dashboard)/tiktok/watchlists/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { suggestWatchItems, createWatchlist, pullWatchlist } from '@/lib/useWatchlist';

export default function TikTokWatchlists(){
  const [niche, setNiche] = useState('real estate');
  const [suggestedCreators, setSuggestedCreators] = useState<string[]>([]);
  const [suggestedHashtags, setSuggestedHashtags] = useState<string[]>([]);
  const [selected, setSelected] = useState<{creators:Set<string>; hashtags:Set<string>}>({ creators: new Set(), hashtags: new Set() });
  const projectId = 'FIXED_PROJECT_ID';

  useEffect(()=>{ (async()=>{
    const s = await suggestWatchItems(niche);
    setSuggestedCreators(s.creators||[]);
    setSuggestedHashtags((s.hashtags||[]).map((h:string)=> h.startsWith('#')? h.slice(1): h));
  })(); }, [niche]);

  function toggle(set:Set<string>, v:string){ set.has(v)? set.delete(v): set.add(v); return new Set(set); }

  async function onCreate(){
    const items = [
      ...Array.from(selected.creators).map(handle=> ({ item_type:'creator', handle, source:'suggested' })),
      ...Array.from(selected.hashtags).map(hashtag=> ({ item_type:'hashtag', hashtag, source:'suggested' })),
    ];
    const res = await createWatchlist(projectId, niche, 'Starter Watchlist', items);
    console.log('created', res);
  }

  async function onPull(){
    // Placeholder example: pull with manual entries
    const entries = [
      { url:'https://www.tiktok.com/@demo/video/123', title:'Demo', creator:'@demo', publishedAt:new Date().toISOString(), likes:100, comments:12 }
    ];
    const res = await pullWatchlist('WATCHLIST_ID', entries);
    console.log('pulled', res);
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex gap-2 items-center">
        <input className="border rounded-xl p-2 w-80" value={niche} onChange={e=>setNiche(e.target.value)} />
        <button className="rounded-xl border px-3 py-2" onClick={onCreate}>Create Watchlist</button>
        <button className="rounded-xl border px-3 py-2" onClick={onPull}>Pull Now</button>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">Suggested Creators</h3>
          <div className="flex flex-wrap gap-2">
            {suggestedCreators.map(c=> (
              <button key={c} onClick={()=> setSelected(s=> ({...s, creators: toggle(s.creators, c)}))}
                className={`px-3 py-1 rounded-xl border ${selected.creators.has(c)? 'bg-black text-white':''}`}>{c}</button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Suggested Hashtags</h3>
          <div className="flex flex-wrap gap-2">
            {suggestedHashtags.map(h=> (
              <button key={h} onClick={()=> setSelected(s=> ({...s, hashtags: toggle(s.hashtags, h)}))}
                className={`px-3 py-1 rounded-xl border ${selected.hashtags.has(h)? 'bg-black text-white':''}`}>#{h}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

> Your dev agent can now: 1) call the generator with deterministic platform prompts and validate JSON; 2) wire the Library to discovery; 3) create/suggest/pull TikTok watchlists from a UI. Shout if you want a Supabase Edge Function cron template next.

# LLM Provider Adapter (OpenAI & OpenRouter)

> Unified JSON-mode chat completions with retries and parsing guard. Swaps providers via env.

## 0) Env additions (`.env.local.example`)

```
# LLM Provider
LLM_PROVIDER=openai           # openai | openrouter
LLM_MODEL=gpt-4o-mini         # default model (must support JSON output)

# OpenAI
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1

# OpenRouter (proxy to many models; prefer ones with JSON support)
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
SITE_URL=http://localhost:3000   # sent as HTTP-Referer for OpenRouter etiquette
```

## 1) Client (`/lib/llm.ts`)

```ts
// Unified LLM adapter for JSON-mode chat completions

type Provider = 'openai'|'openrouter';

const PROVIDER: Provider = (process.env.LLM_PROVIDER as Provider) || 'openai';
const MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

const OR_API_KEY = process.env.OPENROUTER_API_KEY;
const OR_BASE = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OR_REF = process.env.SITE_URL || 'https://example.com';

function baseAndHeaders(){
  if(PROVIDER === 'openrouter'){
    if(!OR_API_KEY) throw new Error('Missing OPENROUTER_API_KEY');
    return {
      base: OR_BASE,
      headers: {
        'Authorization': `Bearer ${OR_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': OR_REF,
        'X-Title': 'AI Content Agent',
      }
    };
  }
  // default: openai
  if(!OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY');
  return {
    base: OPENAI_BASE,
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    }
  };
}

async function backoff<T>(fn: ()=>Promise<T>, tries=3): Promise<T>{
  let attempt = 0; let lastErr: any;
  while(attempt < tries){
    try { return await fn(); } catch(e: any){
      lastErr = e;
      const status = e?.status || e?.code;
      if(status && ![429,500,502,503,504].includes(Number(status))) break;
      await new Promise(r=> setTimeout(r, 400 * Math.pow(2, attempt)));
      attempt++;
    }
  }
  throw lastErr;
}

export async function chatJson(system: string, user: string): Promise<string>{
  const { base, headers } = baseAndHeaders();
  const url = `${base}/chat/completions`;
  const payload: any = {
    model: MODEL,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ]
  };

  const res = await backoff(async ()=>{
    const r = await fetch(url, { method:'POST', headers, body: JSON.stringify(payload) });
    if(!r.ok){ const text = await r.text(); const err: any = new Error(`LLM ${r.status} ${text}`); err.status = r.status; throw err; }
    return r.json();
  });

  // OpenAI/OpenRouter both use choices[0].message.content
  const content = res?.choices?.[0]?.message?.content;
  if(typeof content !== 'string') throw new Error('LLM returned empty content');
  return content;
}

// Helper to salvage JSON if model returns extra prose accidentally
export function extractJsonCandidate(text: string){
  const s = text.indexOf('{');
  const e = text.lastIndexOf('}');
  if(s >= 0 && e >= s) return text.slice(s, e+1);
  return text;
}
```

## 2) Wire into Generator Route (`/app/api/generate/route.ts`)

```ts
import { NextResponse } from 'next/server';
import { makePrompt, SYSTEM } from '@/lib/prompts';
import { parsePack } from '@/lib/validator';
import { chatJson, extractJsonCandidate } from '@/lib/llm';

export async function POST(req: Request){
  const { platform, reference, offer } = await req.json();
  const prompt = makePrompt(platform, reference, offer);

  const raw = await chatJson(SYSTEM, prompt); // raw may include whitespace
  let jsonText = raw;
  try {
    const pack = parsePack(jsonText);
    return NextResponse.json(pack);
  } catch {
    // Attempt repair by extracting JSON block
    jsonText = extractJsonCandidate(raw);
    const pack = parsePack(jsonText);
    return NextResponse.json(pack);
  }
}
```

## 3) Notes for Models

- Use models with **native JSON mode** when possible (e.g., `gpt-4o-mini`, `gpt-4.1-mini`).
    
- If proxied via OpenRouter, pick their OpenAI-compat models that respect `response_format`.
    
- Keep temperature low and prompts deterministic; the Zod validator will fail noisy outputs.
    

---

# Library ⟷ Analyses Wiring (Enrichment Join)

> Enrich Library cards with **real analysis bullets** when a reference URL already exists in DB + was analyzed. Falls back to discovery heuristics otherwise.

## API — Find Analyses by URL (`/app/api/analyses/find/route.ts`)

```ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(req: Request){
  const { urls = [] } = await req.json();
  if(!Array.isArray(urls) || urls.length === 0) return NextResponse.json({ map: {} });

  const sb = supabaseServer();
  // 1) Fetch reference ids for given URLs
  const { data: refs, error: e1 } = await sb
    .from('references')
    .select('id,url')
    .in('url', urls);
  if(e1) return NextResponse.json({ error: e1.message }, { status:400 });
  const byId: Record<string,string> = {};
  for(const r of refs||[]) byId[r.id] = r.url;
  const ids = Object.keys(byId);
  if(ids.length === 0) return NextResponse.json({ map: {} });

  // 2) Fetch most recent analyses for those refs
  const { data: analyses, error: e2 } = await sb
    .from('analyses')
    .select('reference_id,reasons')
    .in('reference_id', ids)
    .order('created_at', { ascending:false });
  if(e2) return NextResponse.json({ error: e2.message }, { status:400 });

  // 3) Build map url -> bullets
  const map: Record<string,string[]> = {};
  for(const a of analyses||[]){
    const url = byId[a.reference_id];
    if(url && a.reasons?.bullets?.length && !map[url]){
      map[url] = a.reasons.bullets as string[];
    }
  }
  return NextResponse.json({ map });
}
```

## Client Hook — Enrich Items (`/lib/useLibraryEnrich.ts`)

```ts
import { useEffect, useState } from 'react';

export function useLibraryEnrich(items: { url:string }[]){
  const [bulletsByUrl, setBullets] = useState<Record<string,string[]>>({});

  useEffect(()=>{
    const urls = Array.from(new Set((items||[]).map(i=> i.url).filter(Boolean)));
    if(urls.length === 0) { setBullets({}); return; }
    let ignore=false;
    (async()=>{
      try{
        const res = await fetch('/api/analyses/find', { method:'POST', body: JSON.stringify({ urls }) });
        const json = await res.json();
        if(!ignore) setBullets(json.map||{});
      }catch{ if(!ignore) setBullets({}); }
    })();
    return ()=>{ ignore=true; };
  }, [JSON.stringify((items||[]).map(i=> i.url))]);

  return bulletsByUrl;
}
```

## Library Page — Use Enrichment

```tsx
// app/(dashboard)/library/page.tsx
'use client';
import { useState } from 'react';
import { useDiscovery } from '@/lib/useDiscovery';
import { useLibraryEnrich } from '@/lib/useLibraryEnrich';

export default function Library(){
  const [platform, setPlatform] = useState<'shorts'|'reels'>('shorts');
  const [niche, setNiche] = useState('real estate');
  const { items, loading } = useDiscovery(platform, niche);
  const bulletsByUrl = useLibraryEnrich(items);

  return (
    <div className="p-6 space-y-4">
      <div className="flex gap-2">
        <select className="border rounded-xl p-2" value={platform} onChange={e=>setPlatform(e.target.value as any)}>
          <option value="shorts">YouTube Shorts</option>
          <option value="reels">Instagram Reels</option>
        </select>
        <input className="border rounded-xl p-2 w-80" value={niche} onChange={e=>setNiche(e.target.value)} placeholder="Enter niche…"/>
      </div>
      {loading ? <div>Loading…</div> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((r:any)=> {
            const enriched = bulletsByUrl[r.url];
            const bullets = enriched?.length ? enriched : (r.why_worked?.bullets||[]);
            return (
              <div key={r.id||r.url} className="rounded-2xl border p-4">
                <div className="text-xs uppercase opacity-60">{r.platform}</div>
                <a className="font-semibold block line-clamp-2" href={r.url} target="_blank" rel="noreferrer">{r.title}</a>
                <div className="text-sm opacity-80">{r.creator}</div>
                <ul className="mt-2 list-disc list-inside text-sm">
                  {bullets.slice(0,2).map((b:string, i:number)=> <li key={i}>{b}</li>)}
                </ul>
                <button className="mt-3 rounded-xl border px-3 py-1 text-sm">Model</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

## Notes

- This **does not** persist newly discovered YT/IG items. If you want analyses to appear later for those, ensure you **upsert references** (by URL) when running ingest/analyze. Then revisiting the Library will pick them up via this enrichment join.
    
- If you prefer a single round-trip, add a `withAnalysis=true` flag to `/api/discover` and perform the Supabase join server-side.