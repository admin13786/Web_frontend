# Full Stack CI/CD

This deployment flow keeps `FrontEnd`, `Backend/Crawl`, `Backend/WorkShop`
and `Backend/OpenMAIC`
on the same server revision window so the frontend does not drift away from the
APIs it depends on.

## Scope

- `FrontEnd` publishes the Vue + Nginx site on port `80`
- `Backend/Crawl` publishes:
  - `api` on port `8000`
  - `crawler` on port `6600`
  - `monitor` on port `6666`
- `Backend/WorkShop` publishes:
  - `Workshop` on port `5000`
  - `agent-do` on port `18000`
- `Backend/OpenMAIC` publishes Next.js on port `3000`

## Trigger strategy

The same GitHub Actions workflow should exist in both repositories:

- `FrontEnd/.github/workflows/deploy.yml`
- `Backend/.github/workflows/deploy-full-stack.yml`

The legacy backend workflow at `Backend/.github/workflows/deploy.yml` is kept as
manual fallback only. It should not auto-run on `push`.

Any push to `main` in either repo triggers the same remote deploy routine:

1. Pull `Backend/main`
2. Pull `FrontEnd/main`
3. Rebuild and restart `Crawl`
4. Rebuild and restart `WorkShop`
5. Rebuild and restart `OpenMAIC`
6. Rebuild and restart `FrontEnd`

This fixes the old problem where only `FrontEnd` was updated.

## Server layout

The workflow defaults to these directories on the server:

```bash
~/FrontEnd
~/Backend
```

If your server uses different paths, set shell env vars before the workflow
script runs:

```bash
export FRONTEND_DIR=/your/frontend/path
export BACKEND_DIR=/your/backend/path
```

And that they are Git working copies of:

- `FrontEnd-0317.git`
- `Backend.git`

## Required GitHub secrets

Configure the same secrets in both repositories:

- `ECS_HOST`
- `ECS_USER`
- `ECS_SSH_KEY`

## Required server-side env files

These files are not committed, but must exist on the server before deployment:

```bash
~/Backend/Crawl/.env
~/Backend/WorkShop/.env
~/Backend/OpenMAIC/.env.local
```

`~/Backend/WorkShop/.env` must also include deployment-specific Agent-Do values:

- `AGENT_DATA_HOST_ROOT=/absolute/path/to/Backend/Agent-Do/data`
- optional `AGENT_DO_PORT`, `WORKSHOP_PORT`
- optional `DOCKER_BIN_PATH`, `DOCKER_SOCK_PATH`

These are required because Agent-Do starts nested Docker workloads and needs the
host-visible absolute workspace path.

If `OpenMAIC` image/video generation is required, make sure
`~/Backend/OpenMAIC/.env.local` includes valid provider credentials such as:

- `IMAGE_SEEDREAM_API_KEY`
- `IMAGE_QWEN_IMAGE_API_KEY`
- `IMAGE_NANO_BANANA_API_KEY`
- `VIDEO_SEEDANCE_API_KEY`
- `VIDEO_KLING_API_KEY`

## Zero-drift deployment order

The workflow uses:

```bash
docker compose -f ~/Backend/Crawl/docker-compose.yml up -d --build --remove-orphans
docker compose -f ~/Backend/WorkShop/docker-compose.yml up -d --build --remove-orphans
docker compose -f ~/Backend/OpenMAIC/docker-compose.yml up -d --build --remove-orphans
docker compose -f ~/FrontEnd/docker-compose.yml up -d --build --remove-orphans
```

Why this order:

- `Crawl` first, because `FrontEnd` depends on `/api/ranks`, `/api/og-image`, and screenshot APIs
- `WorkShop` second, because `/api/workshop/*` now depends on `Workshop` and `agent-do`
- `OpenMAIC` third, because `FrontEnd` links into it and calls its generation APIs
- `FrontEnd` last, so the user-facing shell is rebuilt only after its dependencies are ready

## First-time migration checklist

1. Confirm both repositories are on the server and track `main`
2. Add the GitHub secrets to both repositories
3. Ensure the server env files exist and contain production credentials
4. Set frontend upstream envs if you do not want to use the defaults:
   - `NGINX_API_UPSTREAM_HOST`
   - `NGINX_API_UPSTREAM_PORT`
   - `NGINX_WORKSHOP_UPSTREAM_HOST`
   - `NGINX_WORKSHOP_UPSTREAM_PORT`
5. Push the workflow change to both repositories
6. Trigger `workflow_dispatch` once from either repository to validate the server layout
7. Verify:
   - `http://server/api/ranks/main/weibo`
   - `http://server/api/workshop/agent-do/sandbox-pool`
   - `http://server/openmaic` or direct `:3000` access path
   - homepage leaderboard cover images
   - OpenMAIC image generation

## Operational notes

- The workflows now preserve server-side runtime assets such as `Crawl/db`,
  `Crawl/logs`, `WorkShop/.env`, `WorkShop/metrics.db`, `OpenMAIC/.env.local`,
  and `Agent-Do/data` during `git clean`
- Frontend static images are still heavily cached by Nginx; if a PNG changes without a filename
  change, browsers may continue to show the old asset until cache is busted
