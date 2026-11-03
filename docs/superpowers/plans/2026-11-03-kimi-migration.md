# Kimi migration implementation plan

> Execute inline; user approved direct implementation on 2026-11-03.

**Goal:** Replace all active Qwen/DashScope integration with Kimi Open Platform vision; keep DeepSeek text and existing permissions.
**Architecture:** `/api/kimi-vl` calls Moonshot China's OpenAI-compatible endpoint using server-only `MOONSHOT_API_KEY` and `KIMI_VL_MODEL=kimi-k3.1-pro`. K3 always reasons, so the handler sends `reasoning_effort=low` and `max_completion_tokens=1024`; it omits the K2-only `temperature`/`thinking` fields. Existing token/size/rate limits remain. Old route forwards to Kimi for cached clients. Keep `ai_qwen` solely as the existing database storage identifier to avoid requiring a live database migration; expose `ai_kimi` in summaries and neutral labels for historical vision events.
**Tech Stack:** Existing Vite/React, Vercel JS functions, Supabase, Node built-in test runner.
**Spec:** User-approved scope in conversation: replace Qwen with Kimi throughout this repository.

## Global constraints

- No real secrets in code or requests during local tests.
- Keep student-only vision, shared daily/minute limits, existing response shape and historical totals.
- No database schema change or DeepSeek provider change.
- Deliver an isolated branch and pull request; production requires environment configuration.

## Review focus

- 401/403 and malformed images must never reach upstream.
- Client cannot change model, reasoning effort or token cap.
- Legacy route must call Kimi, and database constraints must still accept logs.
- Network/upstream/JSON errors must return sanitized 502.
- Historical vision counts must not disappear or be falsely attributed exclusively to Kimi.

## Task 1: Migrate vision with offline regression coverage

- [x] Add Node VM-based handler tests with mocked database boundary and fetch; run RED against current handler.
- [x] Create Kimi handler and legacy alias, update frontend, config, smoke tests, analytics labels and documentation.
- [x] Run offline tests GREEN, build, lint, formatting and existing smoke (report missing credentials truthfully).
- [x] Review complete diff independently, commit and create pull request.

## Decisions and evidence

- Ruling: preserve legacy database event identifier and route as compatibility adapters; no Alibaba request or secret lookup remains. This avoids breaking existing database CHECK constraints and cached clients.
- Official reference: Kimi K3.1 Pro quickstart and model list (https://platform.kimi.ai/docs/guide/kimi-k3-1-pro-quickstart, https://platform.kimi.ai/docs/models). K2.5 was retired on 2026-08-31; K3 always reasons, fixes `temperature` at 1.0 and does not accept the K2.x `thinking` field.
- Live preview correction (2026-11-03): runtime logs during the first Preview test showed `Kimi vision upstream rejected request { model: 'kimi-k2.5', status: 404 }`. The initial migration targeted a retired model ID, so no request reached billable inference. The handler now defaults to `kimi-k3.1-pro` and sends only K3-compatible fields.

## Validation result

- RED: 13 of 15 tests failed against old implementation; GREEN: 15/15 passed after migration.
- `npm run lint`, `npm run build`, changed-file Prettier check and `git diff --check` passed.
- Existing `npm run smoke` could not start because `SUPABASE_URL` and live credentials are unavailable. No real Kimi request was performed.
- Independent whole-diff review found no blockers and reproduced 15/15 passing tests.
- Archived source DOCX was not regenerated; current source exporter and Markdown manual are updated.
