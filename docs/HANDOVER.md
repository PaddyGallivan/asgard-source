# Asgard handover — 2026-05-04 (full, cross-account safe)

This is the complete handover. Read all of it before responding to Paddy. Works from any Claude account (Cowork, Claude.ai web, Claude Code, etc.).

> **Token redaction note**: This document is in a public repo. All API tokens use `<vault: KEY>` references.
> Retrieve any token: `curl -H "X-Pin: $PIN" https://asgard-vault.pgallivan.workers.dev/secret/$KEY`
> The VAULT_PIN is `535554` (confirmed active 2026-05-03). AGENT_PIN (fleet workers) is different — get from vault.

## Who you're talking to

**Paddy Gallivan** (pgallivan@outlook.com / paddy@luckdragon.io). PE teacher at Williamstown Primary School. Runs Kow Brainer Trivia (KBT). Loves building tools to simplify work. AFL fan (Bulldogs). Runs family footy tips + racing comps. Casual style — delegate fully, auto-deploy, don't ask permission for reversible things.

## Quick orientation

| Resource | URL / Value |
|---|---|
| Vault | https://asgard-vault.pgallivan.workers.dev |
| Vault PIN (PADDY_PIN) | `535554` — confirmed active 2026-05-03 |
| CF Account ID | `a6f47c17811ee2f8b6caeb8f38768c20` |
| CF API Token | `<vault: CF_API_TOKEN>` |
| CF Pages Token | `<vault: CF_PAGES_TOKEN>` |
| GitHub Token | `<vault: GITHUB_TOKEN>` |
| Resend API Key | `<vault: RESEND_API_KEY>` |
| Workspace folder | `G:\My Drive\Luck Dragon\` |
| Asgard dashboard | https://asgard.pgallivan.workers.dev |

```bash
# Get any credential
curl -H "X-Pin: 535554" https://asgard-vault.pgallivan.workers.dev/secret/GITHUB_TOKEN
curl -H "X-Pin: 535554" https://asgard-vault.pgallivan.workers.dev/secrets   # list all
```

## Active projects

### 1. Clubhouse — Club management platform (PRIMARY — most active)

**What**: Multi-tenant sports club PWA. Each club gets: fixtures, roster, stats, team management, fees, training, events, announcements, B&F voting, push notifications, match day tools, sponsor pages, player photos, PlayHQ sync, CSV import, per-club feature toggles.

**Live URL**: https://clubhouse-e5e.pages.dev
**GitHub repo**: `LuckDragonAsgard/clubhouse`
**Stack**: React 18 + Vite + Tailwind + CF Pages Functions + D1 + R2

**Active clubs**:
| Slug | Club | Sport |
|---|---|---|
| `wcyms` | Williamstown CYMS FC | AFL |
| `youlden` | Youlden Park Cricket Club | Cricket |
| `cyms-cricket` | Williamstown CYMS Cricket Club | Cricket |

**D1 database** (shared with Asgard brain, UUID `b6275cb4-9c0f-4649-ae6a-f1c2e70e940f`):

Tables (all prefixed `ch_` except `clubs`):
- `clubs` — slug, name, sport, primary_colour, secondary_colour, features (JSON), playhq_org_id, playhq_season_id, playhq_last_sync
- `ch_users` — id, email, name, avatar_url, phone
- `ch_sessions` — token, user_id, expires_at (365 days)
- `ch_memberships` — user_id, club_id, role (admin/committee/coach/player/supporter), status, jumper_number, positions
- `ch_fixtures` — club_id, round, **opponent_name** (NOT opponent), date, venue, is_home, score_us, score_them, status, sport, playhq_id, competition, round_name, venue_address
- `ch_ladder` — club_id, team_name, position, played, won, lost, drawn, points, percentage
- `ch_stats` — club_id, fixture_id, user_id, sport, stat_key, stat_value — UNIQUE(fixture_id, user_id, stat_key)
- `ch_announcements`, `ch_events`, `ch_training`, `ch_attendance`
- `ch_teams`, `ch_team_members`
- `ch_fees`, `ch_bf_votes`, `ch_availability`
- `ch_push_subscriptions`, `ch_links`

**API endpoints** (`functions/api/...`):
```
auth/magic-link.js, auth/verify.js
me/index.js
clubs/[slug]/fixtures.js, fixtures/[id]/score.js, fixtures/[id]/stats.js
clubs/[slug]/roster.js
clubs/[slug]/teams/index.js, teams/[id]/index.js, teams/[id]/roster.js
clubs/[slug]/stats/[userId].js, stats/leaderboard.js
clubs/[slug]/announcements/, chat/, events/, training/, availability/
clubs/[slug]/fees/, bf-votes/
clubs/[slug]/upload/avatar.js   (R2 bucket: clubhouse-media, binding: MEDIA)
clubs/[slug]/settings.js        (GET/PATCH feature toggles)
clubs/[slug]/import.js          (CSV import: fixtures or roster)
clubs/[slug]/sync/playhq.js     (GET/PATCH config, POST trigger GraphQL sync)
clubs/[slug]/sync/scrape.js     (POST receive bookmarklet-scraped data)
media/[[path]].js               (serves R2 objects publicly)
superadmin/, onboard.js
```

**Auth pattern** — all sensitive endpoints:
```js
export async function onRequestGet({ params, request, env }) {  // ALWAYS include `request`
  const user = await AUTH(request, env)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { slug } = params
  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(slug).all()
  const clubId = clubs[0].id
  const { results: mem } = await env.DB.prepare(
    "SELECT role FROM ch_memberships WHERE user_id = ? AND club_id = ? AND status = 'active'"
  ).bind(user.id, clubId).all()
  // ... then data
}
```

**Deploy Clubhouse**:
```bash
curl -s -X POST \
  "https://api.cloudflare.com/client/v4/accounts/a6f47c17811ee2f8b6caeb8f38768c20/pages/projects/clubhouse/deployments" \
  -H "Authorization: Bearer $(curl -s -H 'X-Pin: 535554' https://asgard-vault.pgallivan.workers.dev/secret/CF_PAGES_TOKEN)" \
  -H "Content-Type: application/json"
```

**GitHub push pattern**:
```python
import json, base64, urllib.request
GH_TOKEN = "<get from vault>"
def push(path, content, message, sha=None):
    # URL-encode: [ -> %5B, ] -> %5D in path
    url = f"https://api.github.com/repos/LuckDragonAsgard/clubhouse/contents/{path}"
    body = {"message": message, "content": base64.b64encode(content.encode()).decode()}
    if sha: body["sha"] = sha
    req = urllib.request.Request(url, data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {GH_TOKEN}",
                 "Content-Type": "application/json",
                 "Accept": "application/vnd.github.v3+json",
                 "User-Agent": "LuckDragon/1.0"}, method="PUT")
    with urllib.request.urlopen(req) as r: return json.loads(r.read())
```

**Stats system** (tasks 44-45, live):
- AFL stats: goals, behinds, kicks, handballs, disposals, marks, tackles, hitouts, frees_for, frees_against, votes
- Cricket batting: runs, balls, fours, sixes, not_out
- Cricket bowling: overs, maidens, wickets, runs_conceded
- Entry: Admin clicks 📊 Stats on any played fixture → StatsEntry grid (all roster players x all stats)
- Display: Player profile → Season Stats section (totals + averages + game log). Nav → Stats Leaderboard.

**PlayHQ integration** (tasks 42-43, live):
- Bookmarklet: Admin→Settings→PlayHQ Sync → drag 🏉 button to bookmarks bar → click on any PlayHQ page → scrapes fixtures/results/ladder → posts to Clubhouse
- PlayHQ is a SPA with Cloudfront protection — server-side scraping is blocked, bookmarklet (runs in admin's real browser) is the only reliable path
- GraphQL API sync also wired up for clubs with PlayHQ API keys

**Feature toggles per club**: ladder, teams, training, events, bf_voting, matchday, chat, push, fees, news, sponsors, stats

**wrangler.toml** — must include R2 binding or it disappears on deploy:
```toml
[[r2_buckets]]
binding = "MEDIA"
bucket_name = "clubhouse-media"
```

**Completed**: Tasks 1–45 all done and live. Security sweep complete.

**Possible next work**: Scheduled PlayHQ auto-sync, public club page, iOS push, match report PDFs, club website embed widget.

---

### 2. Carnival Timing — carnivaltiming.com

v8.5.2, pre-launch polish complete. Paywall + help + sitemap + admin dashboard.
GitHub: `LuckDragonAsgard/sport-carnival`

---

### 3. School Sport Portal — schoolsportportal.com.au

$1/student/yr, Stripe live, pre-launch polish complete.
CF Worker: `falkor-ssp-ai`

---

### 4. SportCarnival — sportcarnival.com.au

Sitemap + cross-links live. Future: district draw/results page.

---

### 5. Superleague Yeah v4 — AFL fantasy draft app

v4.28 live. https://superleague.streamlinewebapps.com
GitHub: `LuckDragonAsgard/superleague-yeah-v4`

---

### 6. KBT Trivia Tools

Asset pipeline for Kow Brainer Trivia (Paddy's business). Google Slides with `[q]` placeholders.
Key rule: PNGs feed into slide gen automatically — never tell Paddy to paste manually.
Google Drive: default/quiz/ folder, ~20 per-game templates.

---

### 7. Bomber Boat — bomberboat.com.au

Essendon fan boat to Marvel/MCG. GitHub: `PaddyGallivan/bomber-boat`

---

### 8. WPS School projects

- Cross Country 2026: 6 age groups, Firebase draw with bib numbers
- Y2 Maths Intervention: 7-week pack, Vic Curric 2.0, Math Mats + Card Games

---

### 9. Family comps

Paddy runs footy tips + racing tipping comps for his big family. Wants simple, automated tools.

---

## Falkor fleet (17 workers on luckdragon.io)

AGENT_PIN for falkor-* workers: `<vault: AGENT_PIN>` (rotated 2026-05-01 Phase 16)
falkor-dashboard PIN (user-facing login only): `luckdragon`
VAULT_PIN (asgard-vault): `535554`

Phase 16 NOTE: AGENT_PIN was rotated on all workers. PADDY_PIN on vault was NOT updated.
Old vault PIN `IiQGwAW4PT7JePEiWOaJHdKx` was NEVER set — do not use. Use `535554`.

---

## Hard-won infra lessons

1. **wrangler.toml controls CF Pages production bindings** — CF API PATCH is overridden on next deploy. Always edit wrangler.toml for R2/D1/KV bindings.
2. **CF token types**: `cfat_*` = restricted scope. `cfut_*` = full. Use `CF_API_TOKEN` from vault for D1 queries.
3. **GitHub API file paths**: encode `[` as `%5B`, `]` as `%5D`.
4. **CF Pages handler destructuring**: always include `request` — `onRequestGet({ params, request, env })`. Missing `request` → AUTH() throws ReferenceError → 500.
5. **Clubhouse fixtures column**: `opponent_name` NOT `opponent`.
6. **D1 via CF API**: POST with `{"sql": "..."}` body, `Content-Type: application/json`. Multi-line SQL must be Python string not shell heredoc.
7. **CF Pages build errors**: JSX syntax errors only surface at build time. Error 1101 = worker runtime exception. Always verify build status after deploy.
8. **PlayHQ**: SPA, Cloudfront blocks server-side scraping. Bookmarklet runs in admin's real browser — only reliable path.

---

## Account consolidation (complete 2026-05-03)

All on paddy@luckdragon.io: Cloudflare, Stripe, Google Drive, GitHub (LuckDragonAsgard org).
pat_gallivan@hotmail.com is also Paddy's.

---

## Asgard platform

Dashboard: https://asgard.pgallivan.workers.dev
Agent loop: https://asgard-ai.pgallivan.workers.dev
38 tools including deploy, vault, GitHub, Drive, Vercel, Stripe, web search, Chrome bridge, desktop bridge.
Source: `LuckDragonAsgard/asgard-source`

---

## How to start a new chat

1. This handover auto-fetches at start of each Luck Dragon project chat.
2. Ask Paddy which project today.
3. Get GitHub token: `curl -H "X-Pin: 535554" https://asgard-vault.pgallivan.workers.dev/secret/GITHUB_TOKEN`
4. Check the relevant repo before making changes.
5. Auto-deploy after pushes — no permission needed.
