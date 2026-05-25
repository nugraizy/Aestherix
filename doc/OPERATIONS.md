# Operations

Running, configuring, and operating the bot in development and
production. For deeper architectural detail, see [DOC.md](./DOC.md).

## Run modes

```sh
# All-in-one (bot + embedded dashboard)
node . <session_name> [--flags]

# Bot only
npm run start:bot

# Dashboard only (default port 4000, override with DASHBOARD_PORT)
npm run start:dashboard
```

PM2 split runtime — recommended for production:

```sh
npm run pm2:split          # start both as separate PM2 apps
npm run pm2:split:logs     # tail logs for both
npm run pm2:split:stop     # stop both
```

## CLI flags

Parsed by [meow](https://github.com/sindresorhus/meow), exposed on
`configuration.flags`. Add new flags in `src/core/cli.js`.

| Flag | Short | Description |
|---|---|---|
| `--prefix` | `-p` | Set custom prefix(es), comma-separated |
| `--read-only` | | Read only |
| `--auto-read` | | Auto read every incoming message |
| `--restrict` | | Restrict moderator commands |
| `--only-logs` | | Only show logs, ignore messages and commands |
| `--no-logs` | | Suppress logs while still responding to commands |
| `--self-mode` | `-s` | Only owner and the bot can use commands |
| `--debug-mode` | | Show full message metadata |
| `--multi-cmd` | `-m` | Enable multi-cmd with `&&` separator |
| `--watch` | `-w` | Watch files and reload on change |
| `--cool-down` | `-c` | Enable command cooldowns |
| `--auto-correct` | | Auto-correct command names |
| `--story` | | Auto-download stories |
| `--offline` | | Set presence to offline |
| `--no-call` | | Reject incoming calls |
| `--ai` | | Handle incoming messages with AI |
| `--limit-reset` | `-l` | Auto-reset user limits |
| `--reset-on-start` | | Reset DB connections on start |
| `--no-limit` | | Disable command limits |
| `--pair-mode` | | Enable pair mode (no QR) |
| `--pair-number` | | Use a specific number for pairing |
| `--test` | | Test connection |
| `--print-self` | | Print host messages in terminal |
| `--pipe` | | Enable command piping with `\|` operator |
| `--rainbow` | `-b` | Rainbow-colored logs |
| `--trace` | | Reserved for future stack-trail control |
| `--help` | `-h` | Show help message |

Example:

```sh
node . mybot --prefix "!,#,." --watch --cool-down --no-logs
```

## Environment variables

The full env schema is in `src/core/env.js`. Required:

- `DATABASE_PROVIDER` — one of `postgresql`, `mysql`, `sqlite`,
  `mongodb` (defaults to `sqlite`).
- `DATABASE_URL` — connection string for the chosen provider.

Everything else is optional. Integration features simply do not work
without their respective keys (Spotify needs `SPOTIFY_*`, Bluesky needs
`BLUESKY_*`, etc.). See `example.env` for the full template grouped by
service.

Boot does not crash on missing optional secrets. The redactor in
`src/core/env.js` automatically scrubs every configured secret value
from log output, so accidental `loggers.info('connection url is', url)`
calls render as `connection url is ***`.

## Database

Prisma with two schemas:

- `prisma/schema.prisma` — SQL (PostgreSQL, MySQL, SQLite)
- `prisma/schema.mongodb.prisma` — MongoDB

The `prisma.config.js` reads `DATABASE_PROVIDER` and picks the right
schema, so `npm run db:generate`, `db:push`, and `db:migrate` all do
the right thing for any provider.

```sh
npm run db:generate          # generate the Prisma client
npm run db:push              # push schema (no migration history)
npm run db:migrate           # SQL only — create + apply a migration
npm run db:migrate:deploy    # SQL only — apply pending migrations in prod
npm run db:reset             # drop and re-create all tables
npm run db:studio            # open Prisma Studio
```

`prisma migrate` is not supported on MongoDB — use `db:push` there.

## Dashboard

Default URL: `http://localhost:4000`. Override with `DASHBOARD_PORT`.

Frontend lives in `dashboard/client/` (Svelte 5 + Vite). Build:

```sh
npm run dashboard:install    # one-time after cloning
npm run dashboard:build      # rebuild after editing dashboard/client/**
npm run dashboard:dev        # Vite dev server with HMR
```

Embedded vs. split:

- Embedded (default): `node .` starts the bot AND mounts the dashboard
  on the same process at `/dashboard`. Set `DASHBOARD_EMBEDDED=0` to
  disable.
- Split: run `npm run start:dashboard` in a separate process — better
  for production isolation.

The dashboard talks to the bot through a Socket.IO bridge on
`DASHBOARD_BRIDGE_PORT` (default 4010), authenticated with
`DASHBOARD_BRIDGE_TOKEN`.

## Sub-bots

The bot supports running additional WhatsApp connections under one
process. Persisted instances live in the `BotInstance` table.

```
.addbot     # owner-only, opens a new sub-bot session
.removebot  # owner-only, removes a sub-bot
.listbots   # owner-only, lists active sub-bots
```

Sub-bots have a reduced command surface: `Owner`-category commands
plus `eval`, `exec`, `shell`, `terminal`, `addbot`, `removebot`,
`ban`, `unban`, `setlimit`, `setrole`, `restart`, `shutdown`,
`setprefix`, `settings` are blocked. The full list lives in
`src/core/router.js#BLOCKED_FOR_SUB`.

## Logging

The logger (`src/core/logger.js`) is the only sanctioned output
channel. Three levels:

```js
loggers.info('label', value);
loggers.warning('label', value);
loggers.error('label', error);  // Error objects auto-format with (file:line) + stack trail
```

Output is automatically redacted (any secret from `env` becomes `***`)
and pushed to the dashboard log panel.

`console.log` is still used in two narrow places:
- `src/index.js` for `--help` output (user-facing CLI text)
- `src/core/cli.js` for unknown-flag warnings (runs before logger init)

Anywhere else, prefer `loggers.*`.

## Troubleshooting

### Bot reconnects in a loop

Check `loggers.error(...)` output. The most common causes:
- `DisconnectReason.badSession` or `loggedOut` — delete
  `src/.tmp/profile-colors/` and any session credentials, then re-pair.
- `connectionLost` / `timedOut` — network issue. The handler retries
  up to 5 times before giving up.

### Tests fail in CI but pass locally

CI uses fresh `npm ci` + `prisma generate`. If a test depends on
side-effect modules running (e.g. `instagram-login.js`), it should
not be in `__tests__/`. Tests must be self-contained with the fakes
in `__tests__/_fixtures/`.

### Dashboard shows stale data

Restart the dashboard bridge: `Ctrl-C` and `npm run start:dashboard`,
or in PM2 split: `pm2 restart aestherix-dashboard`.

### `__dirname is not defined`

This is ESM. Use `'./relative/path'` (cwd-relative) or
`new URL('./file', import.meta.url)`. The contract test catches these
at command import time.
