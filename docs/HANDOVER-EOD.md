# Asgard — Handover (rebuilt 2026-04-27, Session 5)

> **Read this first if you're resuming Asgard work.** Self-contained. Live runtime is on Cloudflare. Source canonical is **GitHub**: https://github.com/PaddyGallivan/asgard-source. **Drive is no longer used at all** — neither for source, configs, nor handovers. This file lives only on GitHub.

> **Rebuild note:** The Session 4 handover (committed 2026-04-27 ~11:30 UTC) was truncated mid-section in the GitHub copy at ~6.5 KB, cutting off the architecture notes, key facts, pending priorities, and health-check recipe. This rebuild restores the missing content. Health check verified all 6 workers green at 2026-04-27 11:48 UTC (deployment IDs captured below).

## Quick orientation

- Live dashboard: https://asgard.pgallivan.workers.dev (PIN `2967`)
- Source: https://github.com/PaddyGallivan/asgard-source
- Owner account: paddy@luckdragon.io (Cloudflare + GitHub via PaddyGallivan user). Google Drive is legacy — do not write to it.
- Deploy mechanism: `POST https://asgard-tools.pgallivan.workers.dev/admin/deploy` with header `X-Pin: 2967`, body `{worker_name, code_b64, main_module}`. Every successful deploy auto-commits source to GitHub.
- Push-without-token relay: `POST https://gh-push.pgallivan.workers.dev/` body `{owner, repo, path, content (base64), message}` — token lives in the worker's env, callers don't need it.

## Live versions (verified green at 2026-04-27 11:48 UTC via /admin/smoke)

| Worker | Version | Last deploy (UTC) | Source path |
|---|---|---|---|
| asgard | **7.9.1** | 2026-04-27 11:28 | `workers/asgard.js` |
| asgard-ai | **5.8.4-errors-log** | 2026-04-27 11:27 | `workers/asgard-ai.js` |
| asgard-tools | **1.4.1-rollback-only** | 2026-04-27 11:11 | `workers/asgard-tools.js` |
| asgard-browser | **1.1.0** | 2026-04-27 07:01 | `workers/asgard-browser.js` |
| asgard-vault | 1.1.0 | 2026-04-25 13:20 | (existing, not touched recently) |
| asgard-brain | 1.2 | 2026-04-24 15:48 | (existing, holds D1) |

## What Asgard does today

**Dashboard (asgard worker)**: Claude-style chat layout, sidebar with Recent / Tools / Projects / System sections. Project tiles load live from D1 (`asgard-brain.products`, 50 rows, sorted by `income_priority`). Click a tile → detail page with Status, Income priority (⭐), Revenue forecast (Y1/Y2/Y3), Last updated, Live URL, Repo, Category, Description. Add/Edit/Remove buttons round-trip through D1 INSERT/UPDATE/DELETE.

**Agent loop (asgard-ai)**: Multi-provider router across Anthropic / OpenAI / Gemini. Picker has 9 models (Claude Opus/Sonnet/Haiku 4.5, GPT-5.5, GPT-5.4, GPT-4o-mini, o3-mini, Gemini 2.5 Pro/Flash). All 9 share **36 tools** in the agent loop:

- `http_request`, `get_worker_code`, `deploy_worker`, `get_secret` (4 — CF/secrets/HTTP)
- `drive_upload`, `drive_search`, `drive_read` (3 — Google Drive; tools remain available for ad-hoc user requests, but **no Asgard project file** is stored on Drive any more)
- `github_get_file`, `github_write_file` (2 — GitHub)
- `send_email` (Resend)
- `vercel_list_projects`, `vercel_list_deployments`, `vercel_get_deployment`, `vercel_redeploy` (4)
- `stripe_list_products`, `stripe_list_payment_links`, `stripe_create_payment_link` (3)
- `supabase_select`, `supabase_insert` (2)
- `web_search` (Tavily)
- `discord_send`
- `browser_screenshot`, `browser_content`, `browser_markdown`, `browser_json`, `browser_links`, `browser_scrape`, `browser_pdf` (7 — Cloudflare Browser Rendering)
- `chrome_navigate`, `chrome_screenshot`, `chrome_extract`, `chrome_click`, `chrome_type` (5 — drives the user's REAL Chrome via the bridge extension)
- `desktop_screenshot`, `desktop_click`, `desktop_type`, `desktop_key`, `desktop_run` (5 — drives the native desktop via Python helper)
- `power_automate_trigger` (kicks Microsoft Power Automate flows by webhook)

**Bridges (user-installed)**:
- Chrome MV3 extension at `bridges/asgard-bridge-extension/` — already installed in Mona's Chrome (verified working, green dot in popup).
- Python desktop helper at `bridges/asgard-desktop.py` — Mona has NOT yet installed this. Setup: `pip install pyautogui pillow requests` then `python ~/asgard-desktop.py`. Auto-start XML at `bridges/asgard-desktop-autostart.xml` for Windows Task Scheduler.

**D1 database** (`asgard-brain`, UUID `b6275cb4-9c0f-4649-ae6a-f1c2e70e940f`, bound to asgard-ai as `env.DB`):
- `products` — 50 rows of real projects + ideas, drives the dashboard tile grid
- `asgard_sync_state` — per-uid blobs for cross-device conversation sync
- `chrome_bridge` — command queue for Chrome extension + desktop helper (uid distinguishes which)
- `errors` — observability log, asgard-ai writes here on tool failures

## Session 4 wins (2026-04-27 architecture pass)

1. **v7.8.0 restored** after another session's spike clobbered prod with an 867-line build. Pulled canonical 1977-line source from Drive (last time Drive was needed), redeployed.
2. **D1 product hub** — dashboard reads PROJECTS live from `asgard-brain.products`, no more hardcoded array. CRUD round-trips through D1.
3. **Source moved Drive → GitHub** — created public repo `PaddyGallivan/asgard-source`, pushed all source. Auto-commit-on-deploy wired into asgard-tools/admin/deploy.
4. **Smoke test gate** — `/admin/smoke` checks deployment status of all 6 workers via CF API. Dashboard "🩺 Run smoke test" button surfaces results.
5. **Rollback** — `/admin/rollback {worker_name, sha}` fetches that commit's source from GitHub and redeploys. Dashboard "Recent versions" UI in Deploy modal lists last 10 commits with click-to-restore.
6. **Errors observability** — asgard-ai logs tool failures to D1 `errors` table. Dashboard Stats modal queries `/admin/errors` and shows last 20 with endpoint / message / detail.
7. **GHA workflow drafted** at `docs/gha-deploy.yml.template` — needs user action to activate (see "Pending" below).

Earlier in the session: Browser Rendering integration, Chrome bridge, Desktop helper, Power Automate trigger, multi-provider tools across all models, GPT-5.5 added to picker, etc.

## What still needs the user

### A. Activate GitHub Actions CI/CD (~5 minutes — full setup in `docs/GHA-SETUP.md`)

The token in `asgard-vault` has only `public_repo` scope, so it can't write to `.github/workflows/`. Paddy to:
1. Mint a new GitHub PAT at https://github.com/settings/tokens/new with `repo` + `workflow` scopes.
2. Add as repo secrets at https://github.com/PaddyGallivan/asgard-source/settings/secrets/actions:
   - `CF_API_TOKEN` = the asgard-fullops token (from `asgard-vault` or `reference_cf_token.md` memory)
   - `ASGARD_PIN` = `2967`
3. `git clone` the repo, copy `docs/gha-deploy.yml.template` → `.github/workflows/deploy.yml`, commit, push.

After that: every push to `workers/` on main → auto-deploy + smoke gate + auto-rollback on failure.

### B. Install the desktop helper (~3 minutes)

```
pip install pyautogui pillow requests
python ~/asgard-desktop.py
```

(Or import `bridges/asgard-desktop-autostart.xml` into Windows Task Scheduler for boot-time auto-start.)

Until this is running, the 5 `desktop_*` tools fail with "desktop bridge not connected" / "Chrome bridge offline" style errors.

## Architecture notes

### Storage routing — **Drive is fully off**
- **GitHub** = canonical source for all worker code and docs. Auto-commit on every successful `/admin/deploy`.
- **Cloudflare** = runtime + state. Workers for compute, D1 (`asgard-brain`) for relational state, R2 for any new file storage.
- **Drive** = deprecated 2026-04-27. No new files, no handovers, no source. Treat the legacy `G:\My Drive\ASGARD\` (or `H:\My Drive\ASGARD\` on other accounts) as do-not-touch — anything still there is historical.

### Deploy paths
- **Manual deploy** (current default): `POST https://asgard-tools.pgallivan.workers.dev/admin/deploy` with `X-Pin: 2967` and `{worker_name, code_b64, main_module}`. Auto-commits source to GitHub on success.
- **Auto-deploy on commit** (pending activation): GHA workflow at `docs/gha-deploy.yml.template`. Once `.github/workflows/deploy.yml` exists, pushing to `workers/*.js` on main triggers deploy + smoke gate + auto-rollback.
- **Rollback**: `POST https://asgard-tools.pgallivan.workers.dev/admin/rollback` with `{worker_name, sha}`. Fetches that commit's source from GitHub and redeploys.
- **Smoke**: `GET https://asgard-tools.pgallivan.workers.dev/admin/smoke` with `X-Pin`. Returns deployment metadata for all 6 workers via CF API (no worker-to-worker fetches).

### CF loopback gotcha
Worker-to-worker fetches inside Cloudflare don't always behave the same as external fetches (zone-internal routing weirdness). The smoke endpoint deliberately uses the CF API to check deployment metadata rather than hitting each worker's `/` — that's why it works reliably from inside `asgard-tools`. For *runtime* health (not just deploy state), use the dashboard's heartbeat panel.

### File-write footgun
Auto-commit-on-deploy means a bad deploy lands in GitHub history too. If a session ever clobbers prod with a broken build, the bad source is committed alongside the deploy. Recovery path: `/admin/rollback` with the SHA of the previous good commit. The Deploy modal's "Recent versions" UI surfaces the last 10 commits with one-click restore.

### Multi-provider routing
`asgard-ai` accepts `?provider=anthropic|openai|gemini` (or sniffs from model id). All 36 tools are normalised into each provider's tool-format — Claude tool blocks, OpenAI function-calling, Gemini function declarations. Tool *execution* path is shared; only the wire format differs. Errors from any tool path land in the D1 `errors` table.

## Key facts (cheat sheet)

- **PIN**: `2967` (X-Pin header for asgard-tools admin endpoints)
- **D1 database**: `asgard-brain`, UUID `b6275cb4-9c0f-4649-ae6a-f1c2e70e940f`, bound to asgard-ai as `env.DB`
- **D1 tables**: `products` (50 rows, dashboard), `asgard_sync_state` (per-uid sync), `chrome_bridge` (command queue), `errors` (observability)
- **CF account**: paddy@luckdragon.io
- **GitHub user**: PaddyGallivan
- **Repo**: `PaddyGallivan/asgard-source` (public)
- **gh-push relay**: `https://gh-push.pgallivan.workers.dev/` — POST `{owner, repo, path, content (base64), message}`. Token in the worker's env, sourced from asgard-vault.
- **Vault**: `asgard-vault.pgallivan.workers.dev` (X-Pin auth) — holds CF_API_TOKEN, Resend API key, Tavily, etc.

## Pending work (priority order)

**High — items needing the user**
1. Activate GHA CI/CD (Section A)
2. Install desktop helper (Section B)

**Medium — clean architecture work I won't do unprompted**
3. Per-device tokens replacing the shared PIN — low value for a one-user system; revisit if Asgard goes multi-user.
4. Worker consolidation (`asgard-tools` + `asgard-ai` → one worker) — refactor risk weighed against benefit; current split is clean enough.

**Low — nice-to-have**
5. Durable Objects WebSocket replacing polling for the Chrome bridge — substantial work, marginal latency win.

## Health check (4-line curl recipe)

Run these to verify everything's green before doing new work:

```bash
# 1. Smoke test — all 6 workers' deployment status (expect ok:true on each)
curl -s -H "X-Pin: 2967" https://asgard-tools.pgallivan.workers.dev/admin/smoke

# 2. Errors log — recent tool failures (expect count:0 if clean)
curl -s -H "X-Pin: 2967" https://asgard-ai.pgallivan.workers.dev/admin/errors

# 3. Dashboard reachable (expect HTTP 200)
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://asgard.pgallivan.workers.dev/

# 4. Brain (D1 host) reachable (expect HTTP 200)
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://asgard-brain.pgallivan.workers.dev/
```

`asgard-vault` and `asgard-browser` return `401` on `/` — that's expected, they're auth-gated. The smoke endpoint reports them green via deployment status.

## Pickup brief for the next Claude session

Paste this into the new session:

> Resuming Asgard work. Read the canonical handover at https://raw.githubusercontent.com/PaddyGallivan/asgard-source/main/docs/HANDOVER-EOD.md — it's self-contained. Run the 4-line health check at the bottom and confirm everything's green before doing anything new. Drive is deprecated everywhere; do not write to Drive paths.
