# Documentations

## Table of Contents `<a name='table'></a>`

- [Additional Context](#additional-context)
- [Configuration](#configuration)
- [Prefix Modes](#prefix-modes)
- [Entry Points](#entry-points)
- [Architecture Flow](#architecture-flow)
- [Commands System](#commands-system)
- [Dashboard](#dashboard)
- [Database](#database)
- [Environment Variables](#environment-variables)
- [Available Flags](#available-flags)
- [Session](#session)
- [Running](#running)
- [Important Files](#important-files)

---

`<br></br>`

# Additional Context

### Changing ID message :

Go to

```sh
node_modules\@adiwajshing\baileys\lib\Utils\generic.js:172
```

> **IMPORTANT**
> Change the `BAE5` to anything. (`DO NOT` includes special characters!)

#### Or you can include `customId` to the socket config.

```javascript
const CONNECTION_CONFIG = {
	...YOUR_CONFIG,
	customId: 'HFINDER'
};
```

<div align='center'>
<a href='#table'>⬆️ Go Up</a>
</div>

## Session

- Session name resolved from CLI arg or `settings.json.main_session` (default: `aestherix-bot`)
- Default session name derived in `src/core/cli.js` (`DEFAULT_SESSION`) via sync `fs.readJSONSync`

<div align='center'>
<a href='#table'>⬆️ Go Up</a>
</div>

## Running

- All-in-one: `node . <session_name> [--flags]`
- Bot only: `npm run start:bot`
- Dashboard only: `npm run start:dashboard`
- PM2 split: `npm run pm2:split`

<div align='center'>
<a href='#table'>⬆️ Go Up</a>
</div>

## Important Files

- `src/helper/config/connect.js` — global config singleton, reads `settings.json`, holds `configuration.flags`, `configuration.registry`, and caches
- `src/core/cli.js` — `Cli` class (meow wrapper), exports parsed flags and session name
- `src/helper/config/settings.json` — bot config (prefix, owner, limits, etc.). Write via `fs.writeJSON` to persist
- `src/core/boot.js` — boot orchestrator, wires all core classes
- `src/core/client-socket.js` — `ClientSocket` class, owns all send/media/template methods
- `src/core/context.js` — `Context` class, per-message lazy getters + convenience methods
- `src/core/router.js` — `Router` class, command lookup + cooldown + sub-bot blocking
- `src/core/manager.js` — `Manager` class, multi-instance orchestration
- `src/helper/groups/settings/group-default-settings.js` — `updateSettings()` updates group settings in DB, not settings.json

<div align='center'>
<a href='#table'>⬆️ Go Up</a>
</div>

## Database

Uses **Prisma** with two separate schemas. Provider is set via `DATABASE_PROVIDER` in `.env`.

### Schemas

- `prisma/schema.prisma` — SQL (PostgreSQL, MySQL, SQLite)
- `prisma/schema.mongodb.prisma` — MongoDB

### SQL Providers

| Provider                     | `DATABASE_PROVIDER` | `DATABASE_URL` example                           |
| ---------------------------- | --------------------- | -------------------------------------------------- |
| PostgreSQL / Supabase / Neon | `postgresql`        | `postgresql://user:pass@host:5432/db`            |
| MySQL / MariaDB              | `mysql`             | `mysql://user:pass@host:3306/db`                 |
| SQLite (local dev)           | `sqlite`            | `file:./databases/local.db`                      |
| MongoDB Atlas                | `mongodb`           | `mongodb+srv://user:pass@cluster.mongodb.net/db` |

> **MySQL note:** the `session` field on the Session model can exceed `varchar(191)`. If you see truncation errors, ALTER TABLE to TEXT after running `prisma migrate dev`.

> **MongoDB note:** `prisma migrate` is NOT supported. Use `prisma db push` instead.

### Schema auto-selection

`prisma.config.js` reads `DATABASE_PROVIDER` and routes every Prisma command (`generate`, `db push`, `migrate`, `studio`) to the matching schema — `prisma/schema.mongodb.prisma` for `mongodb`, `prisma/schema.prisma` otherwise.

### SQL Schema Models

| Model                       | Purpose                                                                         | Scoped                        |
| --------------------------- | ------------------------------------------------------------------------------- | ----------------------------- |
| `Session`                 | Baileys signal-key state and credentials                                        | Per-bot (by sessionId prefix) |
| `BaileysStore`            | Persisted Baileys in-memory store snapshot (per session)                        | Per-bot                       |
| `PinterestProfilePicture` | Profile picture history entries                                                 | Shared                        |
| `UserLimit`               | Per-user command limit and subscription role (`FREE`, `PREMIUM`, `OWNER`) | Per-bot (`sessionName`)     |
| `BannedUser`              | Globally banned WhatsApp JIDs                                                   | Shared                        |
| `Contact`                 | WhatsApp contact name cache                                                     | Per-bot (`sessionName`)     |
| `SettingsManager`         | Per-group settings (welcome, anti-link, etc.)                                   | Per-bot (`sessionName`)     |
| `DashboardSession`        | Dashboard auth sessions (token/role/phone/expiry)                               | Shared                        |
| `DashboardAuditLog`       | All admin actions logged                                                        | Shared                        |
| `DashboardBlocklist`      | Blocked IPs/values                                                              | Shared                        |
| `DashboardOtp`            | One-time passwords for owner login                                              | Shared                        |
| `DashboardKV`             | Generic key-value store (dashboard state + command catalog)                     | Per-bot (`sessionName`)     |
| `BotInstance`             | Persisted sub-bot instances (flags, role, pairNumber, isActive)                 | Shared                        |
| `CommandUsage`            | Cumulative per-command invocation counter                                       | Shared                        |
| `WerewolfSession`         | Persisted werewolf game sessions                                                | Shared (keyed by group)       |

### Commands

```sh
npm run db:generate        # prisma generate (SQL)
npm run db:push            # prisma db push (SQL)
npm run db:migrate         # prisma migrate dev (SQL)
npm run db:reset           # prisma migrate reset (SQL)
npm run db:studio          # prisma studio (visual DB browser)
npm run db:generate:mongo  # prisma generate --schema=prisma/schema.mongodb.prisma
npm run db:push:mongo      # prisma db push --schema=prisma/schema.mongodb.prisma
```

<div align='center'>
<a href='#table'>⬆️ Go Up</a>
</div>

## Entry Points

### `index.js` — Bot launcher (root)

Loads env, checks internet, prints banner + active flags, then imports `src/index.js`. No business logic here — just setup.

```sh
node . <session_name> [--flags]
```

### `src/index.js` — Main bot module

- Imports `configuration` singleton from `connect.js` — holds all runtime state
- Sets `configuration.flags = cli.flags` (CLI flags accessible everywhere)
- Calls `boot()` from `src/core/boot.js` which orchestrates the connection
- Handles profile picture auto-rotation service
- Handles dashboard bridge for standalone dashboard mode

### `src/core/boot.js` — Boot orchestrator

Creates and wires all core classes:

```
boot({ cli, OPTIONS, store, sessionName })
├── Auth(prisma, sessionName)
├── ClientSocket(auth, { role: 'primary', flags })
│   └── clientSocket.connect({ store })
├── handlePairing(clientSocket, flags)
├── manager.add(sessionName, clientSocket)
├── MqttBridge().connect()
├── WebhookServer()
├── CommandLoader + Router
├── EventHandler(clientSocket, { router, store }).bind()
├── on 'connected': dashboard, webhook, werewolf, watcher
└── spawnPersistedSubBots() — auto-starts saved sub-bots
```

### `dashboard.js` — Standalone dashboard

Runs only the Express + Socket.IO dashboard server without the bot. Used for `npm run start:dashboard`.

### `dashboard/server/` — Dashboard backend

Express + Socket.IO server on `DASHBOARD_PORT` (default 4000).

### `dashboard/client/` — Dashboard frontend

Svelte 5 + Vite. `npm run dashboard:build` produces `dashboard/client/dist/` which the server serves at `/dashboard`.

### `gradient/` — Mesh gradient renderer

Standalone module exposing `createGradientRouter()` for `/render` and `/gradient`. Uses puppeteer (lazy import) and ffmpeg.

<div align='center'>
<a href='#table'>⬆️ Go Up</a>
</div>

## Architecture Flow

```
Baileys WebSocket (ClientSocket.connect())
	|
	v
EventHandler.bind() — forwards all Baileys events
	|
	|-- connection.update -> ConnectionHandler.handle()
	|                       (reconnect, metrics, banner)
	|
	|-- messages.upsert -> MessageHandler.handle()
	|   |
	|   |  1. Retry relay for fromMe messages
	|   |  2. Stub message guard
	|   |  3. Context.from(rawMessage, client, store)
	|   |     (lazy getters, prefix cache, group cache)
	|   |  4. Dispatch loop (multi-cmd support)
	|   v
	|   Router.resolve(body) -> command lookup
	|   |  - Auto-correct misspelled commands
	|   |  - Sub-bot blocking (router.isBlocked)
	|   |  - Guard: isOwner, isBanned, cooldowns, limits
	|   v
	|   command.run(ctx, client, store)
	|
	|-- messages.update -> deleted-message handler
	|-- group-participants.update -> group-participants handler
	|-- groups.update -> group-settings handler
	|-- presence.update -> AFK handler (inlined)
	|-- call -> call rejection (inlined)
	|-- contacts.upsert/update -> contact cache
	|-- creds.update -> auth.saveCreds()
	'-- poll.update -> poll vote decryption
```

### Supporting flows

- **Deleted messages:** `MessageHandler.onDeleted()` -> lazy-loads `deleted-message.js` -> `Context.from()`
- **Stub messages:** `parseStubtypeUpdate()` -> `stub.js` -> `Context.from()`
- **Dashboard real-time:** Socket.IO emits on state changes; embedded bridge on port 4010 syncs between standalone dashboard and bot
- **Commands loading:** `CommandLoader.load()` reads `src/commands/**/*.js`, validates via Yup schema, registers in `configuration.registry.commands` (Cache Map)
- **Multi-instance:** `Manager` holds all `ClientSocket` instances; sub-bots spawned via `!addbot` or auto-loaded from `BotInstance` table on startup

<div align='center'>
<a href='#table'>⬆️ Go Up</a>
</div>

## Commands System

Commands live in `src/commands/<category>/<name>.js`. Each is a default-exported object created with `defineCommand()` and validated by a Yup schema in `CommandLoader`.

### Command object shape

```js
import { defineCommand } from '../_define.js';

export default defineCommand({
  name: 'ping',                 // unique command name (required)
  minifiedDescription: '',      // short description for compact menus
  description: '',              // full description
  usage: '!ping',               // example usage string
  aliases: ['pong'],            // alternate names (array of strings)
  category: 'Misc',             // must be one of the valid categories
  cooldown: 8,                  // seconds before same user can use again (default: random 0-9)
  limit: 0,                     // uses per reset window (default: random 0-9)
  status: 'enable',             // 'enable' | 'disable'
  restrict: false,              // true = only works when --restrict flag is off
  premium: false,               // true = FREE role users blocked (owner/PREMIUM allowed)
  async run(ctx, client) {}     // (required) the command handler
});
```

### Valid categories

`AI` | `AL-Quran` | `Anime` | `Anonymous` | `Converter` | `Debugging` | `Downloader` | `Games` | `Genshin Impact` | `Helper` | `Look-up` | `Misc` | `Moderation` | `News` | `Owner` | `Search`

### Run function signature

```js
async run(ctx, client, store) {}
```

- `ctx` — `Context` instance from `Context.from()` (lazy getters + convenience methods)
- `client` — `ClientSocket` instance (call `client.send()`, `client.reply()`, `client.TemplateBuilder`, etc.)
- `store` — persistent in-memory store (messages, contacts, etc.)

### Command execution flow

1. `MessageHandler.handle()` receives message upsert
2. `Context.from()` parses the raw message (lazy getters, prefix cache, group cache)
3. `MessageHandler.#dispatch()` loop (multi-cmd `&&` support):
   - `Router.resolve(body)` -> command lookup
   - `Router.isBlocked(command)` -> sub-bot permission check
   - Guard: disabled (dashboard), isOwner, cooldown, limit, restrict, premium
   - Auto-correct misspelled commands (if `--autoCorrect` flag)
   - Dispatches to `command.run(ctx, client, store)`
4. `Router.trackUsage()` persists usage count to DB

### Command piping (`--pipe` flag)

Pipe the output of one command into another using `|`:

```
.igpost <url> | .sticker
.ytaudio <url> | .soundremover
.googleimage cats | .sticker
```

**Flow:**

1. `#dispatch()` detects `|` in message body -> delegates to `PipelineExecutor`
2. Each stage runs sequentially; intermediate stages use `CapturingClient` to intercept output
3. Captured output (media or text) feeds into the next stage as input
4. Final stage sends to the real client

**Guards:**

- Max 3 stages
- Eval, Owner, Games, Moderation commands blocked from piping
- Media-only commands (sticker, removebg) reject text input; text-only commands reject media
- If a later stage fails, the previous stage's output is still delivered to the user

**Execution lock:**

- Heavy commands (Downloader, Converter, Search, AI, Anime) acquire a per-user lock
- If a user tries another heavy command while one is running: "Please wait, your previous command (X) is still running."
- Lock auto-expires after 60s as a safety net

### Adding a new command

1. Create `src/commands/<category>/my-command.js`
2. Export default object with at minimum: `name`, `category`, `usage`, `run`
3. Run the bot — it auto-loads on startup (or use `--watch` to hot-reload)

<div align='center'>
<a href='#table'>⬆️ Go Up</a>
</div>

## Configuration

Edit settings in `src/helper/config/settings.json`. All keys are optional unless noted — the bot falls back to sensible defaults if a key is missing.

| Key                           | Type                      | Default           | Description                                                               |
| ----------------------------- | ------------------------- | ----------------- | ------------------------------------------------------------------------- |
| `main_host_number`          | string                    | —                | Primary host WhatsApp number (digits only, no JID suffix).                |
| `backups_host_numbers`      | string[]                  | `[]`            | Secondary host numbers allowed to pair.                                   |
| `owner_number`              | string (JID)              | —                | Owner JID (e.g.`628xxx@s.whatsapp.net`). Receives owner-only commands.  |
| `team_number`               | string[]                  | `[]`            | Extra JIDs treated as owners.                                             |
| `state`                     | `public` \| `private` | `public`        | `private` blocks non-owner command usage.                               |
| `maintenance`               | boolean                   | `false`         | When true, replies with a maintenance notice instead of running commands. |
| `main_session`              | string                    | `aestherix-bot` | Default session name when none is passed on the CLI.                      |
| `max_group`                 | number                    | `20`            | Max number of groups the bot will join.                                   |
| `min_members`               | number                    | `20`            | Minimum members a group must have for some moderation features.           |
| `limit`                     | number                    | `30`            | Default per-user command limit per reset window.                          |
| `reset_time.minute`         | string                    | `"6"`           | Minute of the hour when daily limits reset.                               |
| `reset_time.hour`           | string                    | `"00"`          | Hour of the day (24h) when daily limits reset.                            |
| `tebak_gambar.expired_time` | number                    | `20`            | Seconds before a Tebak Gambar round expires.                              |
| `prefix.multi`              | boolean                   | `true`          | Enable multi-prefix matching. See[Prefix Modes](#prefix-modes).              |
| `prefix.nopref`             | boolean                   | `false`         | Treat every incoming message as a command.                                |
| `prefix.pref`               | string                    | `"."`           | Single-mode prefix, and base prefix for multi mode.                       |
| `prefix.customPrefixes`     | string[]                  | `[]`            | Extra characters appended to the multi-prefix set.                        |
| `debugger`                  | boolean                   | `false`         | Verbose internal logs.                                                    |
| `logger_theme`              | string                    | `dracula`       | One of `dracula`, `synthwave`, `cyberpunk2077`, `catppuccin`.     |
| `delay`                     | number                    | `2`             | Global delay (seconds) between outgoing messages.                         |

<div align='center'>
<a href='#table'>⬆️ Go Up</a>
</div>

## Prefix Modes

Prefix resolution obeys CLI flag > settings.json > defaults. Use whichever surface fits your workflow.

| Mode                | When it triggers a command                                                       | Example                         |
| ------------------- | -------------------------------------------------------------------------------- | ------------------------------- |
| **Single**    | Message starts with `prefix.pref`                                              | `.ping`                       |
| **Multi**     | Message starts with `prefix.pref` *or* any char in `prefix.customPrefixes` | `!ping`, `.ping`, `#ping` |
| **No prefix** | Every message is evaluated as a command                                          | `ping`                        |

Precedence order:

1. `--prefix <char,char,...>` on the CLI overrides everything. If `settings.prefix.multi: true`, CLI prefixes are merged with the multi-prefix base set.
2. No CLI flag + `settings.prefix.multi: true` (even if `nopref` is also true) → multi mode with the base set plus `prefix.customPrefixes`.
3. No CLI flag + `settings.prefix.nopref: true` → no-prefix mode.
4. Neither → single mode using `prefix.pref`.

Prefix state is cached in `configuration.prefix.{mode,values,regex,default}` and refreshed in the background on new messages.

You can also change the mode live from the [Dashboard](#dashboard) under `Settings > Prefix`. Changes persist to settings.json via the Dashboard KV store.

<div align='center'>
<a href='#table'>⬆️ Go Up</a>
</div>

## Dashboard

Aestherix ships with an embedded Express + Socket.IO dashboard. Open `http://localhost:4000` by default (override with `DASHBOARD_PORT`).

### Running

| Command                     | Description                                         |
| --------------------------- | --------------------------------------------------- |
| `npm run start`           | Bot**and** embedded dashboard in one process. |
| `npm run start:dashboard` | Dashboard only, no bot.                             |
| `npm run pm2:split`       | Bot and dashboard as separate PM2 apps.             |

When running embedded, the bot exposes a bridge on `DASHBOARD_BRIDGE_PORT` (default `4010`) so the standalone dashboard process can talk to the live bot.

### Panels

- **Controls** — flip boolean flags and toggle commands on/off.
- **Status** — connection status, memory/CPU usage, uptime, and message rate charts.
- **Audit** — log of admin actions performed via the dashboard.
- **Logs** — live stream of bot logs via Socket.IO.
- **Settings** — polling intervals, chart history, autosave timing, and **Prefix** configuration (single / multi / no-prefix with custom prefix characters).

### Auth

- **Owner** actions (toggling flags, updating prefix, restarting the bot) require an OTP sent to the owner number.
- **Admin** actions are gated by a dashboard session cookie issued after owner login.

### REST API (`/api/dashboard/...`)

| Endpoint                   | Auth      | Description                               |
| -------------------------- | --------- | ----------------------------------------- |
| `GET /prefix`            | Dashboard | Get current prefix config                 |
| `POST /prefix`           | Owner     | Update prefix (persists to settings.json) |
| `GET /flags`             | Dashboard | List all boolean flags and states         |
| `POST /flags/:name`      | Owner     | Toggle a boolean flag                     |
| `GET /commands`          | Dashboard | List all commands with usage counts       |
| `POST /commands/:name`   | Owner     | Enable/disable a command                  |
| `GET /users`             | Dashboard | List users with limits and roles          |
| `POST /users/:jid/limit` | Owner     | Set user command limit                    |
| `POST /bot/restart`      | Owner     | Restart the bot                           |
| `GET /audit`             | Dashboard | Audit log entries                         |

### Socket.IO rooms

`dashboard:status` | `dashboard:commands` | `dashboard:users` | `dashboard:logs` | `dashboard:confirmation:*`

- Real-time bot status, command list, user list, log streaming
- Confirmation bridge to embedded bot on port 4010

### Dashboard monitor

- `initializeDashboardMonitor(configuration)` — called at startup, loads persisted disabled commands and flag states from DB
- `applyPersistedFlags()` — CLI flags take priority; DB values fill in the rest
- `setDashboardCommandState()` — enable/disable commands (persisted to DB)
- `setDashboardFlagState()` — toggle boolean flags (persisted to DB)
- `pushDashboardLog()` / `getDashboardLogs()` — in-memory log buffer (max 500 entries)

<div align='center'>
<a href='#table'>⬆️ Go Up</a>
</div>

## Environment Variables

Copy `example.env` to `.env` and fill in what you need. The bot boots even if most are empty — only the database vars are strictly required.

### Database

| Variable              | Required | Description                                               |
| --------------------- | -------- | --------------------------------------------------------- |
| `DATABASE_PROVIDER` | ✅       | `postgresql` \| `mysql` \| `sqlite` \| `mongodb`. |
| `DATABASE_URL`      | ✅       | Connection string for the chosen provider.                |

### Dashboard

| Variable                  | Default  | Description                                                           |
| ------------------------- | -------- | --------------------------------------------------------------------- |
| `DASHBOARD_PORT`        | `4000` | HTTP port for the dashboard.                                          |
| `DASHBOARD_EMBEDDED`    | `1`    | Set `0` to disable the embedded dashboard (used by PM2 split mode). |
| `DASHBOARD_BRIDGE_PORT` | `4010` | Port the embedded bot listens on for the standalone dashboard.        |

### Scraper / API credentials

| Variable                                                           | Used by                                                                  |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `TWITTER_COOKIE`                                                 | Twitter commands (post download, user lookup, tweets, timeline, search). |
| `INSTAGRAM_SESI`, `INSTAGRAM_USERNAME`, `INSTAGRAM_PASSWORD` | Instagram commands and DM notifier.                                      |
| `TELEGRAM_TOKEN`                                                 | Telegram integrations.                                                   |
| `OPENAI_KEY`                                                     | Character AI and AI completions.                                         |
| `YOUTUBE_AUTH`                                                   | Authenticated YouTube actions.                                           |
| `PINTEREST_COOKIE`                                               | Pinterest scraper.                                                       |
| `WEATHER_KEY`                                                    | Weather command.                                                         |
| `ACR_HOST`                                                       | ACRCloud song identification.                                            |
| `UBERDUCK_BASIC`                                                 | Uberduck text-to-speech.                                                 |
| `BING_COOKIE`                                                    | Bing integrations.                                                       |

<div align='center'>
<a href='#table'>⬆️ Go Up</a>
</div>

## Available Flags

Flags are kebab-case on the CLI. The bot reads them via [meow](https://github.com/sindresorhus/meow) and exposes them on `configuration.flags`.

| Flag                 | Short  | Description                                      |
| -------------------- | ------ | ------------------------------------------------ |
| `--prefix`         | `-p` | Set custom prefix(es), comma-separated           |
| `--read-only`      |        | Read only                                        |
| `--auto-read`      |        | Auto read every incoming message                 |
| `--restrict`       |        | Restrict moderator commands                      |
| `--only-logs`      |        | Only show logs, ignore messages and commands     |
| `--silent`        |        | Suppress logs while still responding to commands |
| `--self-mode`      | `-s` | Only owner and the bot can use commands          |
| `--debug-mode`     |        | Show full message metadata                       |
| `--multi-cmd`      | `-m` | Enable multi-cmd with `&&` separator           |
| `--watch`          | `-w` | Watch files and reload on change                 |
| `--cool-down`      | `-c` | Enable command cooldowns                         |
| `--auto-correct`   |        | Auto-correct command names                       |
| `--story`          |        | Auto-download stories                            |
| `--offline`        |        | Set presence to offline                          |
| `--reject-calls`        |        | Reject incoming calls                            |
| `--ai`             |        | Handle incoming messages with AI                 |
| `--limit-reset`    | `-l` | Auto-reset user limits                           |
| `--reset-on-start` |        | Reset DB connections on start                    |
| `--unlimited`       |        | Disable command limits                           |
| `--pair-mode`      |        | Enable pair mode                                 |
| `--pair-number`    |        | Use a specific number for pairing                |
| `--test`           |        | Test connection                                  |
| `--print-self`     |        | Print host messages in terminal                  |
| `--pipe`           |        | Enable command piping with `\|` operator        |
| `--help`           | `-h` | Show help message                                |
| `--rainbow`        | `-b` | Rainbow-colored logs                             |
| `--trace`          |        | Show errors                                      |

### Example

```sh
# multi-prefix bot with watch + cooldowns + no-logs, session name "mybot"
node . mybot --prefix "!,#,." --watch --cool-down --silent
```

<div align='center'>
<a href='#table'>⬆️ Go Up</a>
</div>
