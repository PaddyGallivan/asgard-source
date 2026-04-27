# Asgard Source

Canonical source code for the Asgard worker stack and helpers. Auto-committed by `asgard-tools/admin/deploy` on every deploy.

## Live workers

| Worker | Domain | Source |
|---|---|---|
| asgard | https://asgard.pgallivan.workers.dev | `workers/asgard.js` |
| asgard-ai | https://asgard-ai.pgallivan.workers.dev | `workers/asgard-ai.js` |
| asgard-tools | https://asgard-tools.pgallivan.workers.dev | `workers/asgard-tools.js` |
| asgard-browser | https://asgard-browser.pgallivan.workers.dev | `workers/asgard-browser.js` |

## User-installed bridges

- `bridges/asgard-bridge-extension/` — Chrome MV3 extension (manifest, background, popup)
- `bridges/asgard-desktop.py` — Python desktop helper (uses pyautogui)
- `bridges/asgard-desktop-autostart.xml` — Windows Task Scheduler import for auto-start
- `bridges/README-desktop.md` — desktop helper setup guide

## Deploy

POST to `https://asgard-tools.pgallivan.workers.dev/admin/deploy` with `X-Pin: 2967` and body:
```json
{"worker_name":"asgard","main_module":"asgard.js","code_b64":"<base64 source>"}
```

The deploy handler writes source to this repo on success — every deploy = a commit.

## Versions

Numbered files (e.g. `asgard-home-v783.js`) only exist as historical snapshots in legacy storage and are not used. The canonical source for each worker lives at `workers/{worker_name}.js` here. Drive is no longer used.
