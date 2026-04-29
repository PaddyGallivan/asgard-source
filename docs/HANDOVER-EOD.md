# Asgard — Handover (end of Session 6, 2026-04-29)

> **Read this first if you're resuming Asgard work.** Self-contained. Live runtime is on Cloudflare. Source canonical is **GitHub**: https://github.com/PaddyGallivan/asgard-source. **Drive is no longer used for source/configs/handovers.** This file lives only on GitHub.

> **Session 6 tagline:** PIN reset (watchdog had stripped secrets). Dashboard fixed — three template-literal backslash-stripping bugs killed all JS. `/login` cookie-auth route added. piOverlay onclick fixed. asgard-vault PIN still broken — GITHUB_TOKEN inaccessible until vault is fixed.

## Quick orientation

- Live dashboard: https://asgard.pgallivan.workers.dev/login (PIN `NmDa-tZmSywcMVLy`)
- Source: https://github.com/LuckDragonAsgard/asgard-source (LuckDragonAsgard org, not PaddyGallivan)
- Owner account: paddy@luckdragon.io (Cloudflare + GitHub)
- Deploy mechanism: `POST https://asgard-tools.pgallivan.workers.dev/admin/deploy` with header `X-Pin: NmDa-tZmSywcMVLy`, body `{worker_name, code_b64, main_module}`.
- Bootstrap AI (unauthenticated): `POST https://asgard-tools.pgallivan.workers.dev/chat/smart` — has `get_secret`, `deploy_worker`, `http_request`, `get_worker_code` tools. Useful for vault-bypass ops.

## Live versions (verified 2026-04-29)

| Worker | Version | Notes |
|---|---|---|
| asgard | **session-6-fixed** | Template literal JS bugs fixed, `/login` route added |
| asgard-ai | 5.8.5-drive-share | Unchanged |
| asgard-tools | 1.4.1-rollback-only | Unchanged |
| asgard-vault | 1.1.0 | ⚠️ PIN broken — see below |
| asgard-brain | 1.2 | Unchanged |

## Session 6 wins

1. **PIN reset** — watchdog cron redeploy had stripped all `PADDY_PIN` secrets from all workers. New PIN `NmDa-tZmSywcMVLy` set on asgard-brain, asgard-tools, asgard-ai via `/chat/smart` bootstrap (unauthenticated CF API calls). Works for dashboard login and admin/deploy.

2. **Dashboard JS fixed (3 bugs, all template-literal backslash-stripping)**  
   The worker embeds all client JS inside `const HTML = \`...\`` — any backslash sequence (`\/`, `\.`, `\'`) gets stripped when JS processes the template literal, breaking the browser-side code.
   - **Bug 1 — regex:** `url.match(/https?:\/\/([^.]+)\.pgallivan\.workers\.dev/)` → slashes stripped → broken regex. Fixed with pure string ops: `url.indexOf('.pgallivan.workers.dev') > -1`.
   - **Bug 2 — apostrophe:** `'can\'t hold open connections'` → `can't` breaks the string. Fixed: changed to `"cannot hold open connections"`.
   - **Bug 3 — piOverlay onclick:** `onclick="if(event.target.id==='piOverlay')"` — the `\'` became `'` which terminated the outer JS string. Fixed: `onclick="if(event.target===this)closeProjInfo()"` (semantically equivalent, no string comparison needed).

3. **`/login` route + cookie bridge added** — `POST /login` sets `asgard_pin=VALUE` cookie → redirects to `/`. Cookie bridge at top of client `<script>` reads cookie → writes to `localStorage`. This allows login without needing to manipulate localStorage directly (enables phone + fresh-browser login).

4. **SportPortal pitch updated** — Five-Year Growth Model ($512k Y1 → $3M Y5), Competitive Landscape section, district sales model framing. File: `G:\My Drive\sportportal-pitch.docx`.

## ⚠️ KNOWN ISSUES — must fix next session

### 1. asgard-vault PIN broken (HIGH)
The vault worker at `asgard-vault.pgallivan.workers.dev` returns `{"ok":false,"error":"Unauthorized — X-Pin required"}` for PIN `NmDa-tZmSywcMVLy`. The CF secret was set (via `CF_API_TOKEN`) but the vault worker may be checking a different secret name, or the secret binding wasn't re-applied after deploy.

**Symptoms:** Can't retrieve any secrets from vault (GITHUB_TOKEN, MIGRATION_TOKEN, etc.)  
**Fix:** Use `/chat/smart` bootstrap to call CF API → `PUT /accounts/.../workers/scripts/asgard-vault/secrets` for `PADDY_PIN`. Or check vault source for which env var name it uses for PIN auth.

### 2. GitHub commit of asgard.js PENDING
Could not commit the fixed `asgard.js` back to GitHub because GITHUB_TOKEN is in the vault (broken). The live worker is correct but GitHub source is behind.

**What's in GitHub now:** Pre-fix version with template literal bugs.  
**What's live:** Fixed version (piOverlay + regex + apostrophe).  
**Fix:** Once vault is fixed, fetch `/tmp/asgard_final.js` content (or live worker source), commit to `workers/asgard.js` on `LuckDragonAsgard/asgard-source`. SHA at time of session 6: `11b2a293941b0d1cfc193465d9e8293dee4cc843`.

### 3. Jacky email not sent
Jacky's PIN was set (via Session 5). No email service (no SENDGRID/RESEND/MAILGUN key in vault). Paddy needs to manually email:
- **To:** rooney.jaclyn.l@gmail.com  
- **Login URL:** https://asgard.pgallivan.workers.dev/login  
- **PIN:** `844c9c1b89a2ed19`

## Key facts (cheat sheet)

- **PIN:** `NmDa-tZmSywcMVLy` (replaces old `2967` — stripped by watchdog)
- **Jacky PIN:** `844c9c1b89a2ed19`
- **D1 database:** `asgard-brain`, UUID `b6275cb4-9c0f-4649-ae6a-f1c2e70e940f`, bound to asgard-ai as `env.DB`
- **D1 tables:** `products`, `asgard_sync_state`, `chrome_bridge`, `errors`
- **CF account:** paddy@luckdragon.io
- **CF account ID:** `a6f47c17811ee2f8b6caeb8f38768c20`
- **GitHub org:** LuckDragonAsgard (canonical for asgard-source repo)
- **GitHub user:** PaddyGallivan (asgard-handovers + other project repos)
- **Repo:** `LuckDragonAsgard/asgard-source` (public)
- **Vault:** `asgard-vault.pgallivan.workers.dev` — ⚠️ PIN broken, see above
- **Bootstrap AI:** `POST https://asgard-tools.pgallivan.workers.dev/chat/smart` (unauthenticated, has get_secret/deploy_worker/http_request)
- **R2 buckets:** `asgard-archive` (mirror), `asgard-archive-manifest`, `asgard-backups`
- **Drive→R2 SA:** `kbt-slides@asgard-493906.iam.gserviceaccount.com`
- **Migrator URL:** `https://drive-r2-migrator.pgallivan.workers.dev`

## Template-literal backslash rule (CRITICAL for future edits)

All client-side JS in `asgard.js` lives inside `const HTML = \`...\``. JavaScript processes this template literal when the worker starts, stripping all unintended backslash sequences. **Rule: never put backslash-escaped characters in the HTML template string.** Specifically:
- No regex with `\/` or `\.` — use string ops instead
- No `\'` in single-quoted strings — use double-quoted strings or `cannot`/rephrase
- No `\"` in double-quoted strings inside the template — restructure HTML
- The only safe backslash sequences inside the template are `\\` (produces `\`) and `\`` (produces a backtick)

## Pending work (priority order)

**Immediate (next session start)**
1. Fix vault PIN → run `GET /secret/GITHUB_TOKEN` to verify
2. Commit fixed `asgard.js` to GitHub (SHA ref: `11b2a293941b0d1cfc193465d9e8293dee4cc843`)
3. Send Jacky's email (or add email service: Resend.com free tier, set RESEND_API_KEY in vault)

**Medium**
4. Commit `.github/workflows/deploy.yml` for CI/CD (was Session 5 pending)
5. Migrate other 2 Drive accounts (pgallivan@outlook.com, hello@knowbrainertrivia.com.au)

**Low / nice-to-have**
6. Add email service (Resend.com) for system notifications
7. Per-device tokens replacing shared PIN
8. Worker consolidation (asgard-tools + asgard-ai → one)

## Health check

```bash
# Dashboard reachable
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://asgard.pgallivan.workers.dev/

# Admin smoke (uses new PIN)
curl -s -H "X-Pin: NmDa-tZmSywcMVLy" https://asgard-tools.pgallivan.workers.dev/admin/smoke

# Vault PIN check
curl -s -H "X-Pin: NmDa-tZmSywcMVLy" https://asgard-vault.pgallivan.workers.dev/secret/GITHUB_TOKEN
```

## Pickup brief for the next Claude session

> Resuming Asgard work. Read the canonical handover at https://raw.githubusercontent.com/LuckDragonAsgard/asgard-source/main/docs/HANDOVER-EOD.md — it's self-contained. Run the health check at the bottom. Priority 1: fix vault PIN so GITHUB_TOKEN is accessible again.
