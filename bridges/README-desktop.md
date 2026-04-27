# Asgard Desktop Helper

Gives Asgard control of your native desktop. Companion to the Chrome extension — that one drives your browser, this one drives everything else (Finder/Explorer, native apps, Terminal, anywhere you can click).

## One-time setup (~2 minutes)

1. **Install Python 3.9+** if you don't have it. macOS comes with it; Windows has it on the Microsoft Store.
2. **Install dependencies** (run in a terminal):
   ```bash
   pip install pyautogui pillow requests
   ```
   - On macOS Apple-silicon you may need: `pip install --upgrade pyautogui pillow requests`
3. **macOS only — grant accessibility permissions**:
   - System Settings → Privacy & Security → Accessibility → add Terminal (or whatever app you'll run Python from) → toggle ON.
   - System Settings → Privacy & Security → Screen Recording → same Terminal → toggle ON.
4. **Save** `asgard-desktop.py` somewhere permanent — e.g. `~/asgard-desktop.py`.

## Run it

```bash
python ~/asgard-desktop.py
```

Leave the terminal window open. You'll see "polling https://asgard-ai.pgallivan.workers.dev as uid=paddy-desktop" and an arrow appears each time Asgard sends a command.

To run on startup, wrap it in a launchd plist (macOS) or Task Scheduler entry (Windows). Tell me your OS and I'll generate the file.

## Failsafe

`pyautogui.FAILSAFE = True` is set — drag your mouse rapidly to the top-left corner of the screen to abort whatever Asgard is doing. Use this if a runaway agent is clicking somewhere wrong.

## Tools available in Asgard once running

- `desktop_screenshot` — full desktop or region capture
- `desktop_click` — click at (x, y) absolute coordinates
- `desktop_type` — type text into the focused field
- `desktop_key` — keystrokes / combos like `cmd+c`, `ctrl+shift+t`, `enter`, `tab`
- `desktop_run` — shell command or open an app

## Try it

In Asgard, after the helper is running:

> "Use desktop_screenshot to capture my screen, then describe what's currently focused."

> "Use desktop_run to `open -a 'TextEdit'` then desktop_type 'Hello from Asgard'."

> "Use desktop_key with 'cmd+space' to open Spotlight."

## Security note

This helper has full access to your machine. Run it only on machines you trust. The PIN gate (default 2967) means random visitors to your asgard-ai URL can't queue commands, but there's no replay protection — if someone steals the PIN, they could drive your desktop. Rotate the PIN periodically or limit when you run the helper.
