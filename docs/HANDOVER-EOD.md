# Asgard — Handover (end of Session 7, 2026-04-30)

> **Read this first if you're resuming Asgard work.** Self-contained. Live runtime is on Cloudflare. Source canonical is **GitHub**: https://github.com/LuckDragonAsgard/asgard-source. **Drive is no longer used for source/configs/handovers.** This file lives only on GitHub.

> **Session 7 tagline:** Custom domain `asgard.luckdragon.io` live. luckdragon.io CF zone added and activated (VentraIP NS → Cloudflare). Vault PIN `2967` confirmed working. Login emailed to Paddy. asgard-backup cron confirmed set.

## Quick orientation

- **Primary URL:** https://asgard.luckdragon.io/login (custom domain — live ✅)
- **Fallback URL:** https://asgard.pgallivan.workers.dev/login
- **PIN:** `2967` (watchdog resets PADDY_PIN to this on every redeploy)
- Source: https://github.com/LuckDragonAsgard/asgard-source (LuckDragonAsgard org)
- Owner account: paddy@luckdragon.io (Cloudflare + GitHub)
- Deploy: `POST https://asgard-tools.pgallivan.workers.dev/admin/deploy` with `X-Pin: 2967`, body `{worker_name, code_b64, main_module}`.
- Bootstrap AI (unauthenticated): `POST https://asgard-tools.pgallivan.workers.dev/chat/smart` — has `get_secret`, `deploy_worker`, `http_request`, `get_worker_code`.

## Live versions (verified 2026-04-30)

| Worker | Version | Notes |
|---|---|---|
| asgard | session-6-fixed | Live at asgard.luckdragon.io + asgard.pgallivan.workers.dev |
| asgard-ai | 5.8.5-drive-share | Unchanged |
| asgard-tools | 1.4.1-rollback-only | Unchanged |
| asgard-vault | 1.1.0 | PIN `2967` — confirmed working |
| asgard-brain | 1.3 | Unchanged |
| asgard-backup | — | Cron `0 18 * * *` confirmed active (6 PM daily) |

## Session 7 wins

1. **luckdragon.io CF zone activated** — Zone added to CF account `a6f47c17811ee2f8b6caeb8f38768c20`. NS updated at VentraIP: `liv.ns.cloudflare.com` + `quinton.ns.cloudflare.com`. Zone activated near-instantly after propagation.

2. **`asgard.luckdragon.io` custom domain live** — Added via CF dashboard (Workers & Pages → asgard → Domains & Routes → Custom domain). CF manages the DNS record automatically. Login page confirmed loading at `https://asgard.luckdragon.io/login`.

3. **Vault PIN `2967` confirmed** — identity.md was correct. Vault and worker PIN both `2967`. Watchdog resets PADDY_PIN to `2967` on every redeploy — no manual action needed.

4. **Login emailed to Paddy** — Sent via Outlook to pgallivan@outlook.com: URL `https://asgard.luckdragon.io/login`, PIN `2967`.

5. **asgard-backup cron confirmed** — `0 18 * * *` already active in CF dashboard. Fires 6 PM daily. No action needed.

## ⚠️ KNOWN ISSUES — must fix next session

### 1. Jacky email not sent (MEDIUM)
No email service configured. Paddy to manually email:
- **To:** rooney.jaclyn.l@gmail.com
- **Login URL:** https://asgard.luckdragon.io/login
- **PIN:** `844c9c1b89a2ed19`

### 2. GitHub commit of asgard.js PENDING (MEDIUM)
Live worker source has not been committed back to GitHub since Session 6 fixes. GitHub is behind the live worker.
- **Repo:** `LuckDragonAsgard/asgard-source`, path `workers/asgard.js`
- **Fix:** Fetch live worker code via asgard-tools `get_worker_code`, push to GitHub via direct API.

## Key facts (cheat sheet)

- **PIN:** `2967` (watchdog always resets to this)
- **Jacky PIN:** `844c9c1b89a2ed19`
- **D1 database:** `asgard-brain`, UUID `b6275cb4-9c0f-4649-ae6a-f1c2e70e940f`, bound to asgard-ai as `env.DB`
- **D1 tables:** `products`, `asgard_sync_state`, `chrome_bridge`, `errors`
- **CF account:** paddy@luckdragon.io
- **CF account ID:** `a6f47c17811ee2f8b6caeb8f38768c20`
- **luckdragon.io zone:** CF zone active, NS: `liv.ns.cloudflare.com` + `quinton.ns.cloudflare.com`
- **GitHub org:** LuckDragonAsgard (canonical for asgard-source repo)
- **GitHub user:** PaddyGallivan (asgard-handovers + other project repos)
- **Repo:** `LuckDragonAsgard/asgard-source` (public)
- **Vault:** `asgard-vault.pgallivan.workers.dev` — PIN `2967` ✅
- **Bootstrap AI:** `POST https://asgard-tools.pgallivan.workers.dev/chat/smart` (unauthenticated)
- **R2 buckets:** `asgard-archive`, `asgard-archive-manifest`, `asgard-backups`
- **Multi-user PIN prefixes:** `NmDa`=paddy, `844c`=jacky

## Template-literal backslash rule (CRITICAL for future edits)

All client-side JS in `asgard.js` lives inside `const HTML = \`...\``. JavaScript strips unintended backslash sequences when the worker starts.
- No regex with `\/` or `\.` — use string ops instead
- No `\'` in single-quoted strings — use double-quoted strings
- No `\"` in double-quoted strings inside the template — restructure HTML
- Safe: `\\` (produces `\`), `` \` `` (produces backtick)

## Pending work (priority order)

1. **Email Jacky** — rooney.jaclyn.l@gmail.com, PIN `844c9c1b89a2ed19`, URL `https://asgard.luckdragon.io/login`
2. **Commit asgard.js to GitHub** — fetch live worker code, push to `LuckDragonAsgard/asgard-source/workers/asgard.js`
3. **Add email service** — Resend.com free tier, set `RESEND_API_KEY` in vault, wire up notifications
4. **Per-device tokens** — replace shared PIN for better security
5. **Worker consolidation** — asgard-tools + asgard-ai → one worker

## Health check

```bash
# Dashboard reachable (custom domain)
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://asgard.luckdragon.io/

# Dashboard reachable (fallback)
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://asgard.pgallivan.workers.dev/

# Admin smoke
curl -s -H "X-Pin: 2967" https://asgard-tools.pgallivan.workers.dev/admin/smoke

# Vault check
curl -s -H "X-Pin: 2967" https://asgard-vault.pgallivan.workers.dev/secret/GITHUB_TOKEN
```

## Pickup brief for the next Claude session

> Resuming Asgard work. Read the canonical handover at https://raw.githubusercontent.com/LuckDragonAsgard/asgard-source/main/docs/HANDOVER-EOD.md — self-contained. PIN is `2967`. Primary URL is `https://asgard.luckdragon.io`. Priority: email Jacky, then commit asgard.js to GitHub.
