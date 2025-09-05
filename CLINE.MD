---

# CLINE.md

**Purpose:** This file defines development rules and guardrails for this project so that Cline (and any contributors) follow consistent best practices.

---

## 0) Project Facts

* Framework: **Next.js 15.x (App Router, Turbopack)**
* Language: **TypeScript**
* Database/Auth: **Supabase**
* Styling: **MUI** (+ Tailwind if present)
* Hosting: Vercel or Node runtime

---

## 1) Absolute Guardrails

1. **Secrets never in client code.**

   * Client may only read `NEXT_PUBLIC_*` env vars.
   * Never import server modules in Client Components.
2. **Service Role Key never leaks.**

   * Use only in server context (Node runtime).
3. **No inline secrets in code or commits.**
4. **Runtime must be correct.**

   * If a route needs secrets, add:

     ```ts
     export const runtime = 'nodejs'
     ```
5. **Restart dev server** after any `.env.local` changes.

---

## 2) Directory Conventions

```
/app
  /api/<route>/route.ts    # API routes
  /(routes)                # Pages & layouts
/lib
  /supabase
    client.ts              # 'use client' anon key client
    server.ts              # 'server-only' admin client
  supabase.ts              # optional shim for re-exports
/components
  /layout/Navigation.tsx
```

* Server-only files start with: `import 'server-only'`
* Client-only files start with: `'use client'`
* Path alias `@/*` must be set in `tsconfig.json`.

---

## 3) Supabase Usage

* **Client Components** (browser-safe):

  ```ts
  'use client'
  import { supabase } from '@/lib/supabase/client'
  ```

  Requires:

  * `NEXT_PUBLIC_SUPABASE_URL`
  * `NEXT_PUBLIC_SUPABASE_ANON_KEY`

* **Server Components / API routes** (admin):

  ```ts
  import { getSupabaseAdmin } from '@/lib/supabase/server'
  const supabase = getSupabaseAdmin()
  ```

  Requires:

  * `SUPABASE_URL`
  * `SUPABASE_SERVICE_ROLE_KEY`

* Optional shim `lib/supabase.ts`:

  ```ts
  export { getSupabaseAdmin as supabaseServer } from './supabase/server'
  export { supabase as supabaseClient } from './supabase/client'
  ```

---

## 4) Environment Variables

`.env.local` must contain:

```dotenv
# server-only
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# client-safe
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## 5) Component Boundaries

* **Server Components**: default, can fetch with admin client, no browser-only APIs.
* **Client Components**: `'use client'`, can use hooks/state, no server imports.

Cline must check:

* If a file imports `/lib/supabase/server`, it must not be a client component.
* If a client needs admin data, call an API route or Server Action.

---

## 6) Coding Standards

* **TypeScript:** strict mode
* **Error handling (server):**

  ```ts
  try {
    const { data, error } = await supabase.from('table').select('*')
    if (error) throw error
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
  ```
* **Error handling (client):**

  ```ts
  setLoading(true)
  try {
    const res = await fetch('/api/route')
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Request failed')
  } catch (e: any) {
    setError(e.message)
  } finally {
    setLoading(false)
  }
  ```

---

## 7) API Routes

* Always mark admin-key routes with:

  ```ts
  export const runtime = 'nodejs'
  ```

---

## 8) UI (MUI) Best Practices

* Link `<InputLabel>` and `<Select>` via `labelId` and `id`.
* Use `onKeyDown` instead of `onKeyPress`.
* `<Chip color>` accepts only theme palette keys. For custom colors, use `sx={{ bgcolor, color }}`.
* Wrap disabled `<IconButton>` in `<span>` to keep `<Tooltip>` working.

---

## 9) Build & Test Checklist

Before committing or PR:

1. **Static checks**

   * `npm run typecheck`
   * `npm run lint`
2. **Search for bad imports**

   * No client file imports `/lib/supabase/server`
3. **Run locally**

   * `npm run dev` → hit `/api/health/supabase`
4. **Scan git diff** → no secrets committed
5. **Restart dev server** if env changed

---

## 10) Shell Rules (Windows PowerShell)

* Assume **Windows PowerShell**, not Bash.
* Do **not** use `&&` to chain commands.
* Instead:

  * Sequential: `;`
    Example:

    ```powershell
    cd ai-content-agent; npm run test-env
    ```
  * Conditional:

    ```powershell
    cd ai-content-agent; if ($?) { npm run test-env }
    ```

Cline must rewrite any shell command accordingly.

---

## 11) Work Protocol for Cline

1. **Plan first:** list files to edit + risks.
2. **Search before edit:** confirm existing imports.
3. **Small commits** with clear messages:

   * `fix(api): set runtime=nodejs`
   * `feat(supabase): add client/server split`
4. **Verify boundaries:** no server imports in client.
5. **No logging secrets.**
6. **Open a plan** if rules need updating.

---

## 12) Common Fix Recipes

* **Missing SUPABASE\_URL at runtime** → wrong import (client pulled server). Fix imports + restart dev.
* **Export not found** → adjust import name or add shim in `lib/supabase.ts`.
* **Admin key failing on Edge** → add `export const runtime = 'nodejs'`.

---

## 13) PR Template

```
## Summary
What changed and why.

## Changes
- [x] Split supabase server/client
- [x] Added runtime=nodejs to API routes
- [x] Fixed Chip color sx usage

## Env Vars
Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

## Tests
- Local dev started
- /api/health/supabase returns { ok: true }
- Verified no server imports in client

## Rollback
Revert commit <hash> if needed
```

---
