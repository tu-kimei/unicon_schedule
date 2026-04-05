# Deployment - Unicon Schedule

## Production architecture

Production should use a **single deploy flow** so frontend and backend always come from the same build output.

### Source of truth
- Project root: `/root/.openclaw/workspace/unicon_schedule`
- Wasp output root: `.wasp/out`
- Backend runtime bundle: `.wasp/out/server/bundle/server.js`
- Frontend static bundle: `.wasp/out/web-app/build`

### Runtime
- Backend process manager: `systemd`
- Service: `unicon-schedule.service`
- Nginx static root: `/var/www/schedule.unicon.ltd`
- Public domain: `https://schedule.unicon.ltd`

## Why the old flow caused bugs
Old scripts referenced `.wasp/build/...` while the current runtime/service already used `.wasp/out/server/...` and nginx served static files from `/var/www/schedule.unicon.ltd`.

That mismatch allowed this failure mode:
- backend uses one artifact
- frontend serves another artifact
- production JS still contains stale `http://localhost:3001`
- login breaks with `Network Error`

## Correct deploy command
Use only:

```bash
cd /root/.openclaw/workspace/unicon_schedule
bash ./build-and-run-production.sh
```

## What the unified script does
1. Build Wasp app
2. Bundle backend from `.wasp/out/server`
3. Build frontend static bundle from `.wasp/out`
4. Publish frontend to `/var/www/schedule.unicon.ltd`
5. Restart `unicon-schedule.service`
6. Reload nginx
7. Run a basic health check

## Important rules
- Do **not** deploy from `.wasp/build/...`
- Do **not** hotfix `/var/www/.../assets/*.js` manually except emergency recovery
- Always rebuild and republish frontend + backend together
- Keep `REACT_APP_API_URL=https://schedule.unicon.ltd`
- Keep `.env.server` aligned with production domain settings

## systemd service expectation
`unicon-schedule.service` should keep running from:

```text
WorkingDirectory=/root/.openclaw/workspace/unicon_schedule/.wasp/out/server
ExecStart=/usr/bin/node --enable-source-maps -r dotenv/config bundle/server.js
```

If this changes, update this document and the deploy script together.
