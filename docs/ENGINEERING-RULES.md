# Engineering rules — all products, all sessions

These rules apply to every product in the Luck Dragon / Asgard portfolio
(SLY, LessonLab, Family Hub, Carnival Timing, Sport Carnival, School Sport
Portal, Asgard/Falkor itself, and anything we build next).

Every Claude session must read these rules at session start (alongside
HANDOVER.md). Every product's `RESUME-HERE.md` should link here.

---

## 1. Root-cause before patching

Before changing any code that looks defensive (CSS `!important`, blend
modes, guard clauses, threshold checks, fallback returns), read the
surrounding 30 lines and any nearby comment. If the code reads like a
**workaround**, identify what it's working around. Don't remove the
workaround until the underlying bug is fixed (or proven gone).

If a session feels like solving a problem that was solved before — STOP.
Read the prior commit, find why the fix didn't stick. Don't keep slapping
new patches on top.

> Concrete example (SLY, May 2026): a `mix-blend-mode: multiply` rule was
> hiding broken canvas-strip code. Removing the rule caused white
> rectangles to reappear because the underlying strip was silently failing
> on every image. Two further deploys went out before the actual root
> cause (45% white-pixel guard + missing `crossorigin="anonymous"`) was
> found. The whole class was preventable by reading the comment three
> lines below the rule.

## 2. Verify the effect, not the deploy status

After every deploy, do **not** stop at "deploy returned 200". Fetch the
served output (or the new endpoint, or the rendered page) and verify the
actual effect of the change.

> Concrete example: an auto-refresh poller compared a hardcoded `var V`
> against `/_version`. The bump-replace regex never matched, so V stayed
> stuck. Result: the page reloaded every 7 seconds for everyone. Caught
> only because a user complained — not by the deploy pipeline.

## 3. Every product has `checks.py`

Every product repo must have a `checks.py` (or equivalent) at the root.
Run it after every deploy. Exits 1 if anything red. Add a check whenever
a new bug class is found in production.

Minimum checks per product:

- **Version coherence** — every place a version string is baked into
  served output (HTML constants, meta tags, version endpoints) must
  agree. Single source of truth. Catches reload-loop class.
- **Bindings present** — D1 / KV / R2 / Durable Object bindings exist
  on every worker that needs them. Catches "binding silently
  disappeared on PUT" class.
- **Cron schedules present** — every cron worker has the schedules it
  should. Catches accidental schedule drops.
- **Auth gates** — POST/PATCH/PUT/DELETE endpoints that mutate state
  must require auth. Probe with empty body; if you get 200/400 instead
  of 401/403, that's an auth hole. Use empty bodies so probes never
  write to the DB.
- **Patch effects** — for any project using serve-time patches, check
  the served output contains the marker each patch was supposed to
  inject. Catches anchor drift when the underlying HTML is updated.
- **Data sanity** — row counts on critical tables haven't tanked
  (coaches=16, rounds≥N, payments=16, etc).

See `superleague-yeah-v4/sly-checks.py` for the canonical example.

## 4. Single source of truth for version

The version string lives in **one** place per product (typically
`const VERSION = 'vX.Y'` at the top of the worker). Every other place
that needs the version (route handler, meta tag, baked HTML, build
output, deploy log) reads from it. No literal version strings duplicated.

## 5. Probe writes never persist

Smoke tests must never leave probe data in production tables. Either:
- Send empty/malformed bodies that fail validation before the DB write.
- Use a unique probe marker and clean up via direct DB call at the end
  of the run.

## 6. Workarounds carry a comment

Any code that exists as a workaround for a known bug must include a
one-line comment explaining what it works around. If the underlying bug
is fixed, the workaround can then be removed safely. Without the
comment, future sessions can't tell defence from cargo-cult.

---

## Adding to a product

1. Copy `checks.py.template` (next to this file) to your product repo
   as `<product>-checks.py`.
2. Customise the constants block: app/api URLs, account/binding IDs,
   cron names, mutation endpoints, expected patch markers, expected row
   counts.
3. Add a line to the product's `RESUME-HERE.md`:
   `**Post-deploy:** \`python3 <product>-checks.py\` — must return exit 0.`
4. Make running it part of the deploy ritual — either as a CI step or
   as the last command in your deploy script.
