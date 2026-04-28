# Asgard Bridge — Privacy Policy

**Last updated**: 2026-04-28

## What this extension does

Asgard Bridge is a private utility that lets the user's own Asgard account (running at `asgard-ai.pgallivan.workers.dev`) drive the user's logged-in Chrome browser — navigate, click, type, screenshot, extract text — using the user's existing sessions on any site they're signed into.

## What data we collect

**None.** Asgard Bridge is a personal automation tool. We don't operate any analytics, telemetry, or backend that collects data from the extension.

## What data the extension transmits

- The extension polls a single endpoint, `https://asgard-ai.pgallivan.workers.dev/bridge/poll`, with a user-supplied PIN for authentication.
- When Asgard sends a command (navigate / screenshot / etc), the extension executes it locally in the user's browser and posts the result back to the same Asgard worker that the user controls.
- Screenshots and extracted page content are sent to the user's Asgard worker only when explicitly requested by a command.
- No data is sent anywhere else. No third parties.

## Permissions explained

- `scripting`, `tabs`, `activeTab` — required to navigate, take screenshots, click, type, and extract content from the active tab.
- `storage` — stores the user's PIN locally in Chrome storage so the extension can authenticate to the user's Asgard worker.
- `alarms` — schedules the polling loop.
- `<all_urls>` — required because Asgard may need to drive any site the user instructs it to.

## User control

- The PIN is set by the user in the extension popup. Without a valid PIN, the extension cannot poll Asgard.
- The user can pause or disable the extension at any time via the popup's Enabled toggle, or by removing the extension from Chrome.
- All commands the extension executes come from the user's own Asgard worker — the user controls when and what.

## Data deletion

- Uninstalling the extension removes all stored data (the PIN).
- The extension does not retain any history of commands executed.

## Contact

Source: <https://github.com/PaddyGallivan/asgard-source/tree/main/bridges/asgard-bridge-extension>
