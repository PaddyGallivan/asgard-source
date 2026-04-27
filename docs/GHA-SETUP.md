# GitHub Actions Setup

The deploy workflow YAML lives at `docs/gha-deploy.yml.template`. To activate it:

## One-time setup (~2 minutes)

1. **Mint a new GitHub Personal Access Token** with `repo` AND `workflow` scopes:
   - https://github.com/settings/tokens/new
   - Scopes: `repo` (full control), `workflow` (update GitHub Action workflows)
   - Save the token — you'll paste it twice below

2. **Add the token + CF token as repo secrets**:
   - https://github.com/PaddyGallivan/asgard-source/settings/secrets/actions
   - Click "New repository secret" three times:
     - Name: `CF_API_TOKEN`, Value: the asgard-fullops token (from `asgard-vault`/`reference_cf_token.md`)
     - Name: `ASGARD_PIN`, Value: `2967`
     - (The `GITHUB_TOKEN` secret is automatic — don't add it manually.)

3. **Move the workflow into place**:
   ```bash
   git clone https://github.com/PaddyGallivan/asgard-source
   cd asgard-source
   mkdir -p .github/workflows
   cp docs/gha-deploy.yml.template .github/workflows/deploy.yml
   git add .github/workflows/deploy.yml
   git commit -m "Activate GitHub Actions deploy"
   git push
   ```
   (Use the new PAT when git asks for credentials.)

## What it does once active

- Push to `main` with changes under `workers/` → auto-deploys those workers via `asgard-tools/admin/deploy`
- Runs smoke test after deploy. Fails the workflow if any worker is unhealthy.
- Manually triggerable via Actions tab → "Deploy Asgard workers" → Run workflow with optional specific worker name.

## Update the vault token (also recommended)

While you have the new PAT minted, swap `GITHUB_TOKEN` in `asgard-vault` for it too. That way `github_write_file` and the auto-commit-on-deploy can write to private repos as well.

```
curl -X POST https://asgard-vault.pgallivan.workers.dev/inject \
  -H "X-Pin: 2967" \
  -H "Content-Type: application/json" \
  -d '{"key":"GITHUB_TOKEN","value":"ghp_yournewtokenhere"}'
```

If `/inject` doesn't accept arbitrary keys, edit the secret directly via Cloudflare dashboard or use `wrangler secret put`.
