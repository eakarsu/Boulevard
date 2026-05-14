# Audit Note — Boulevard

## Bucket: HAS_CODE_NO_AI (resolved)

The original audit (batch_09.md) flagged Boulevard as a Skeleton with 13 routes and 0 AI endpoints — accurate for what existed in `server/src/routes/`. This pass confirms the no-AI finding (whole-project grep for `openrouter|openai|anthropic|claude|chat/completions` against 60 source files returned zero hits).

## Action Taken

Added a new TypeScript route module `server/src/routes/ai.ts` and registered it in `server/src/app.ts`. The module mirrors the existing route style (Express router, `query` import from `../config/database.js`, ESM imports, `req: any` handler signature) and does not require any new npm dependencies — it uses Node 18+ native `fetch`.

### Files Touched

- `server/src/routes/ai.ts` (new, 12 endpoints + 1 history endpoint)
- `server/src/app.ts` (added import and `app.use('/api/ai', bypassAuth, aiRoutes)`)

### Endpoints Added

All under `/api/ai`:

1. `GET  /history` — past AI results filtered by business
2. `POST /booking-assistant` — chat-style booking concierge using the live service catalog
3. `POST /no-show-predict` — risk score + mitigations for an appointment
4. `POST /staff-match` — rank staff for a service + client
5. `POST /service-recommend` — upsell-aware service suggestions for a client
6. `POST /schedule-optimizer` — find gaps / overbookings for a day
7. `POST /client-insights` — narrative profile for a client
8. `POST /upsell-suggestions` — at-checkout upsells for an appointment
9. `POST /review-response` — draft public response to a review
10. `POST /reactivation-message` — sms/email win-back for lapsed client
11. `POST /revenue-forecast` — narrative forecast over a date range
12. `POST /waitlist-intelligence` — rank waitlist clients for a freed slot

### Configuration

- Model: `anthropic/claude-haiku-4.5` (overridable via `OPENROUTER_MODEL`)
- API key: `OPENROUTER_API_KEY` env var (required at request time, NOT at startup)
- Persistence: `ai_results` table, auto-created via idempotent `CREATE TABLE IF NOT EXISTS`
- Persistence failures never block the response

### Syntax Check

`./node_modules/.bin/tsc --noEmit --skipLibCheck src/routes/ai.ts` — clean (no errors). The full-project `tsc --noEmit` reports only TS7030 ("not all code paths return a value") warnings on `ai.ts` — identical to the warnings already present in `services.ts`, `clients.ts`, `appointments.ts`, and `middleware/auth.ts`. Style is consistent with the rest of the codebase.

### Out of Scope

- No frontend changes.
- No npm install (uses native `fetch` only).
- No external integrations beyond OpenRouter.
- No environment file changes; users should add `OPENROUTER_API_KEY=...` to whatever .env mechanism is already in use.

## Apply pass 3 (frontend)

FE was missing for the 12 `/api/ai` endpoints. Added a single AI Tools page covering all of them.

### Files Touched
- `src/pages/AITools.tsx` (new) — tool registry + dynamic form-per-endpoint, JSON/textarea inputs where appropriate, axios call via the existing `api` instance (which auto-injects the Bearer token from the project's existing `auth-storage` zustand store), explicit 503/OPENROUTER_API_KEY error surfacing, optional `GET /history` loader.
- `src/App.tsx` — added `import AITools` and `<Route path="/ai" element={<AITools />} />`.
- `src/components/Layout.tsx` — added the `Sparkles` lucide icon and an `AI Tools` nav item between Notifications and Feature Audit.

### Notes
- No new dependencies; uses lucide-react (already installed) and the existing axios `api` instance for token handling.
- TypeScript `transpileModule` syntax-check on all three files: clean. Project's full `tsc --noEmit` has unrelated pre-existing tsconfig/lib mismatch errors.
- No `npm install` performed.

## Apply pass 4 (mechanical backlog)

**SKIPPED.** This note has no enumerated "Backlog" / "Missing AI counterparts" / "Missing non-AI features" / "Custom feature suggestions" rows tagged MECHANICAL. Pass 2 added 12 AI endpoints (`booking-assistant`, `no-show-predict`, `staff-match`, `service-recommend`, `schedule-optimizer`, `client-insights`, `upsell-suggestions`, `review-response`, `reactivation-message`, `revenue-forecast`, `waitlist-intelligence`, plus `GET /history`); pass 3 added the FE `AITools.tsx` covering all of them with 503 handling and JWT bearer auth via the existing axios `api` instance. The "Out of Scope" section only lists policy items (no FE changes / no npm install / no integrations) — none of those are MECHANICAL backlog. No new backend endpoints or FE pages added.
