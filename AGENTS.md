# Aestherix Agent Guide

## Table of Contents
- [Project Structure](#project-structure)
- [`src/utils/` — API modules](#srcutils--api-modules)
- [Entry Points](#entry-points)
- [Architecture Flow](#architecture-flow)
- [Prefix Resolution](#prefix-resolution)
- [Commands System](#commands-system)
- [Dashboard](#dashboard)
- [Database](#database)
- [CLI Flag Reference](#cli-flag-reference)
- [Session](#session)
- [Running](#running)
- [Important Files](#important-files)
- [Code Standards](#code-standards)

## Project Structure

```
aestherix/
├── index.js                          # Bot launcher
├── dashboard.js                      # Standalone dashboard runner
├── package.json
├── prisma.config.js                 # Prisma config (SQL)
├── prisma.config.mongo.js           # Prisma config (MongoDB)
├── ecosystem.config.cjs              # PM2 config
├── eslint.config.js
├── .env / .env.keys / .env.instagram
├── prisma/
│   ├── schema.prisma                # SQL schema
│   └── schema.mongodb.prisma        # MongoDB schema
├── public/
│   └── dashboard/                   # Dashboard frontend
│       ├── index.html               # Main UI
│       ├── home.html / home.js
│       ├── login.html / login.js
│       ├── albums.html / albums.js
│       ├── editor.html
│       ├── styles.css
│       ├── app.js                   # Frontend logic (~8140 lines)
│       ├── app/
│       │   ├── constants.js
│       │   ├── dom.js
│       │   ├── formatters.js
│       │   └── state.js
│       └── zen-cursor.js
└── src/
    ├── index.js                     # Main bot module (~796 lines)
    ├── handlers/                    # Message & event handlers
    │   ├── game_handlers/           # Akinator, Sambung Kata, Tebak Gambar, Wordle
    │   ├── instagram_notifier/
    │   ├── message_presence/
    │   ├── messages_event/           # Incoming, deleted, stub, anonymous, offline, story
    │   ├── misc/                     # Anti-NSFW, check-banned, group-url
    │   └── notification_handlers/    # Group participants, group settings
    ├── helper/
    │   ├── canvas/                  # Image generators (meme, spotify-card, trigger, etc.)
    │   ├── config/                  # connect.js singleton, settings.json
    │   ├── connection/
    │   │   ├── dashboard/           # server.js, dashboard-monitor.js
    │   │   ├── event-handler/       # universal.js (routing hub)
    │   │   ├── github-webhook/      # events.js, server.js, utils.js
    │   │   ├── session/             # Session storage
    │   │   ├── socket/              # socket.js, reset-session.js
    │   │   ├── store/               # In-memory store helpers
    │   │   └── utils/               # commands.js, cache.js, check-flag.js, mqtt.js, etc.
    │   ├── database/
    │   │   ├── adapters/            # Prisma model adapters (user, group-settings, etc.)
    │   │   ├── auth.js
    │   │   ├── index.js
    │   │   └── prisma.js
    │   ├── groups/
    │   │   ├── afk/
    │   │   ├── index.js
    │   │   └── settings/            # group-default-settings.js, limit.js
    │   ├── index.js
    │   ├── misc/
    │   │   ├── index.js
    │   │   ├── palettes/            # colors.js, palettes.json
    │   │   ├── user_agent/          # ua.js, ua.json
    │   │   └── wa_data/             # constants.js, utils.js, web-message-info.js
    │   ├── modules/
    │   │   ├── cache.js
    │   │   ├── index.js
    │   │   ├── parse-message.js
    │   │   └── utils.js
    │   └── prototypes.js
    ├── media/
    │   ├── assets/
    │   ├── background/
    │   ├── connection_databases/
    │   ├── fonts/
    │   ├── screenshots/
    │   └── temporary_files/
    └── types/                       # TypeScript definitions
        ├── Canvas/
        ├── Commands/
        ├── Groups/
        ├── Messages/
        ├── Reconstruct/
        ├── Socket/
        └── Utils/
```

### `src/utils/` — API modules

```
src/utils/
├── index.js                        # Main entry to export every module in one index
├── ai/
├── anime/
├── anonymous/
├── arq/
├── bandcamp/
├── bilibili/
├── bluesky/
├── brainly/
├── cnn/
├── comix/
├── converter/
├── deviant_art/
├── doujin/
├── download_uploader/
├── epicgames/
├── equran/
├── facebook/
├── flickr/
├── games/
├── github/
├── google-it/
├── hi-fi/
├── image_reverse_search/
├── instagram_notifier/
├── instagram/
├── jikan/
├── kiryuu/
├── komikcast/
├── mangatoon/
├── misc/
├── modules/
├── movies/
├── news/
├── p_store/
├── pinterest/
├── pixiv/
├── shortener/
├── spotifier/
├── stickers/
├── textmaker/
├── tiktok/
├── twitter/
├── waifu_pic/
├── wallpapers/
└── youtube/
```

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (60-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk go test             # Go test failures only (90%)
rtk jest                # Jest failures only (99.5%)
rtk vitest              # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk pytest              # Python test failures only (90%)
rtk rake test           # Ruby test failures only (90%)
rtk rspec               # RSpec test failures only (60%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%)
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->

## Entry Points

### `index.js` — Bot launcher (root)
Loads env, checks internet, prints banner + active flags, then imports `src/index.js`. No business logic here — just setup.

```sh
node . <session_name> [--flags]
```

### `src/index.js` — Main bot module (~796 lines)
- Imports `configuration` singleton from `connect.js` — holds all runtime state
- Sets `configuration.OPTIONS = configuration.cli.flags` (CLI flags accessible everywhere)
- Initializes MQTT client for Spotify/Freegame pub-sub
- Creates a persistent Baileys store backed by Prisma
- Calls `start()` which wires all Baileys event listeners:

| Event | Handler |
|---|---|
| `connection.update` | `handleConnectionUpdate` (reconnect, pairing, etc.) |
| `connected` | Wires message/notification handlers, starts MQTT, dashboard server |
| `messages.upsert` | `handleUpsertUpdate` — **entry to command processing** |
| `messages.update` | `handleMessagesUpdate` (deleted messages) |
| `group-participants.update` | `handleParticipantsUpdate` |
| `groups` / `groups.update` | `handleGroupSettingsUpdate` |
| `presence.update` | `handlePresenceUpdate` |
| `call` | `handleCallUpdate` |
| `profile-picture.update` | Profile picture auto-rotation |
| `creds.update` | Saves auth credentials |
| `contacts.upsert/update` | Contact cache |
| `poll.update` | Poll vote decryption |
| `werewolf.cycle` | Werewolf game cycle |
| `commit` | GitHub webhook trigger |

### `dashboard.js` — Standalone dashboard (35 lines)
Runs only the Express + Socket.IO dashboard server without the bot. Used for `npm run start:dashboard`.

### `src/helper/connection/dashboard/server.js` — Dashboard server (~4000 lines)
Express + Socket.IO server on `DASHBOARD_PORT` (default 4000). Handles:
- REST API under `/api/dashboard/` (prefix, flags, commands, users, profile pictures, file editor)
- Socket.IO rooms: `dashboard:status`, `dashboard:commands`, `dashboard:users`, `dashboard:logs`, `dashboard:confirmation:*`
- Owner auth via OTP; admin auth via session cookies
- Dashboard bridge to embedded bot on port 4010 (`DASHBOARD_BRIDGE_PORT`)

### `public/dashboard/` — Dashboard frontend
Static files served by the dashboard server. Key files:

| File | Purpose |
|---|---|
| `index.html` | Main UI with Controls, Status, Audit, Logs, Settings panels |
| `app.js` (~8140 lines) | All frontend logic — polling, Socket.IO, rendering, event handlers |
| `app/dom.js` | DOM element references (cached `getElementById` lookups) |
| `app/state.js` | Reactive state object (commands, flags, users, prefixConfig, etc.) |
| `app/constants.js` | Storage keys, palette configs, route paths |
| `app/formatters.js` | Text rendering, markdown, syntax highlighting utilities |
| `styles.css` | All dashboard styling (~6571 lines) |

### `src/helper/connection/event-handler/universal.js` — Event routing hub (~635 lines)
Routes all Baileys events to specialized handlers. Contains:
- `handleUpsertUpdate()` — lazy-loads `incoming-message.js` and forwards messages
- `handleMessagesUpdate()`, `handleParticipantsUpdate()`, etc.
- `HANDLER_PATH` map for lazy handler loading via `Cache` (avoids circular deps)

### `src/helper/connection/socket/socket.js` — Baileys WebSocket connection
Creates the `Client` via `connectSocket()`, manages auth state, pairing, session reset.

---

## Architecture Flow

```
Baileys WebSocket (socket.js)
        │
        ▼
universal.js — handleUpsertUpdate()
        │     (lazy-loads handler via Cache on first message)
        ▼
incoming-message.js — handleIncomingMessage()
        │
        │  1. Retry relay for fromMe messages
        │  2. Stub message guard
        │  3. initHandler() on first run (loads commands)
        │  4. reassign() — normalizes message + resolves prefix
        ▼
parse-message.js — reassign()
        │     (runs once per connection, caches prefix config)
        │  Resolves: prefixMode, prefixValues, prefixReg, prefixConfig
        │
        ▼  Returns normalized ReassignResult
incoming-message.js — handleCommandExecution() loop
        │  - Re-parses prefix per body (multi-cmd support)
        │  - Auto-correct misspelled commands
        │  - Checks: isOwner, isBlocked, isBanned, cooldowns, limits
        │  - Dispatches to command handler
        ▼
Command handler (src/commands/<category>/<name>.js)
```

### Supporting flows
- **Deleted messages:** `handleMessagesUpdate()` → lazy-loads `deleted-message.js` → `reassign()`
- **Stub messages:** `parseStubtypeUpdate()` → `stub-message.js` → `reassign()`
- **Dashboard real-time:** Socket.IO emits on state changes; embedded bridge on port 4010 syncs between standalone dashboard and bot
- **Commands loading:** `loadCommands()` in `commands.js` reads `src/commands/**/*.js`, registers in `configuration.cmds.commands` (Cache Map)

---

## Prefix Resolution

CLI `--prefix` flag takes priority over settings.json. Logic order:

1. `--prefix` flag present + `settings.prefix.multi: true` → multi-char base + CLI prefixes combined
2. `--prefix` flag present + `settings.prefix.multi: false` → CLI prefixes only (single/multi based on count)
3. No CLI flag + `settings.prefix.multi: true` → multi-char set only
4. No CLI flag + `settings.prefix.nopref: true` → no prefix (all text triggers commands)
5. No CLI flag + `settings.prefix.multi` AND `settings.prefix.nopref` both true → logs conflict warning, falls back to multi
6. No CLI flag + both false → uses `settings.prefix.pref` (default `.`)
7. All above miss → default to `.`

Cache is initialized on first message per connection. `configuration.cache.prefixValues` must exist or prefix re-resolves.

---

## Commands System

Commands live in `src/commands/<category>/<name>.js`. Each is a default-exported object validated by a Yup schema in `src/helper/connection/utils/util.js:5` via `isMissingProperty()`.

### Command object shape
```js
export default {
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
};
```

### Valid categories
`AI` | `AL-Quran` | `Anime` | `Anonymous` | `Converter` | `Debugging` | `Downloader` | `Games` | `Genshin Impact` | `Helper` | `Look-up` | `Misc` | `Moderation` | `News` | `Owner` | `Search`

### Run function signature
```js
async run(ctx, client, store) {}
```
- `ctx` — full `ReassignResult` object from `parse-message.js:reassign()`
- `client` — Baileys `AdvancedClient` instance (access `client.instance` for the raw WaClient)
- `store` — persistent in-memory store (messages, contacts, etc.)

### Key `ctx` properties
| Property | Description |
|---|---|
| `ctx.from` | JID of the chat |
| `ctx.sender` | JID of the sender |
| `ctx.body` | Raw message text |
| `ctx.args` | `['arg1', 'arg2', ...]` split by spaces |
| `ctx.cmd` | Command name without prefix |
| `ctx.query` | Everything after the command name |
| `ctx.prefix` | The prefix character(s) used |
| `ctx.isOwner` | True if sender is in owner_numbers or team_numbers |
| `ctx.isGroup` | True if from is a group JID |
| `ctx.isAdmin` | True if sender is a group admin |
| `ctx.isBotAdmin` | True if bot is a group admin |
| `ctx.message` | Raw Baileys WAMessage object |
| `ctx.pushname` | Sender's display name |
| `ctx.settings` | Merged group + global settings |
| `ctx.prefixInfo` | Current prefix config `{ mode, pref, cliPrefixes, ... }` |

### How commands are loaded
1. `loadCommands(OPTIONS)` in `src/helper/connection/utils/commands.js` reads all `.js` files under `src/commands/` (excludes files containing `template` or `d.ts`)
2. Each file is imported; `isMissingProperty()` validates against the Yup schema
3. Valid commands → `configuration.cmds.commands` (Cache Map, key = command name)
4. Aliases → `configuration.cmds.aliases` array
5. Duplicate names, missing `run`, or validation errors are logged and skip registration
6. If `--watch` flag: `cache.js:watch()` re-imports changed files live

### Command execution flow
1. `handleIncomingMessage()` → calls `reassign()` to parse the message
2. `reassign()` normalizes and extracts: prefix, cmd, args, query, sender, etc.
3. `handleCommandExecution()` loop:
   - Re-parses prefix per body (for multi-cmd `|` separated)
   - Looks up command in `configuration.cmds.commands`
   - Checks: disabled (dashboard), isOwner, cooldown, limit, restrict, premium
   - Auto-correct misspelled commands (if `--autoCorrect` flag)
   - Dispatches to `command.run(ctx, client, store)`
4. `incrementCommandUsage()` tracks usage count in memory

### Adding a new command
1. Create `src/commands/<category>/my-command.js`
2. Export default object with at minimum: `name`, `category`, `usage`, `run`
3. Run the bot — it auto-loads on startup (or use `--watch` to hot-reload)

---

## Dashboard

### Architecture
- Embedded in bot process (when `DASHBOARD_EMBEDDED=1`), bridge on port 4010 (`DASHBOARD_BRIDGE_PORT`)
- Can run standalone via `dashboard.js` without the bot
- Real-time via Socket.IO; REST API under `/api/dashboard/`
- Owner-authenticated endpoints via OTP; admin endpoints require dashboard session cookies
- `public/dashboard/` is served statically

### REST API (`/api/dashboard/...`)
| Endpoint | Auth | Description |
|---|---|---|
| `GET /prefix` | Dashboard | Get current prefix config |
| `POST /prefix` | Owner | Update prefix (persists to settings.json) |
| `GET /flags` | Dashboard | List all boolean flags and states |
| `POST /flags/:name` | Owner | Toggle a boolean flag |
| `GET /commands` | Dashboard | List all commands with usage counts |
| `POST /commands/:name` | Owner | Enable/disable a command |
| `GET /users` | Dashboard | List users with limits and roles |
| `POST /users/:jid/limit` | Owner | Set user command limit |
| `POST /bot/restart` | Owner | Restart the bot |
| `GET /audit` | Dashboard | Audit log entries |

### Socket.IO rooms
`dashboard:status` | `dashboard:commands` | `dashboard:users` | `dashboard:logs` | `dashboard:confirmation:*`
- Real-time bot status, command list, user list, log streaming
- Confirmation bridge to embedded bot on port 4010

### Dashboard monitor (`dashboard-monitor.js`)
- `initializeDashboardMonitor(configuration)` — called at startup, loads persisted disabled commands and flag states from DB
- `applyPersistedFlags()` — CLI flags take priority; DB values fill in the rest
- `setDashboardCommandState()` — enable/disable commands (persisted to DB)
- `setDashboardFlagState()` — toggle boolean flags (persisted to DB)
- `pushDashboardLog()` / `getDashboardLogs()` — in-memory log buffer (max 500 entries)

---

## Database

Uses **Prisma** with two separate schemas. Provider is set via `DATABASE_PROVIDER` in `.env`.

### Schemas
- `prisma/schema.prisma` — SQL (PostgreSQL, MySQL, SQLite)
- `prisma/schema.mongodb.prisma` — MongoDB

### SQL Providers
| Provider | `DATABASE_PROVIDER` | `DATABASE_URL` example |
|---|---|---|
| PostgreSQL / Supabase / Neon | `postgresql` | `postgresql://user:pass@host:5432/db` |
| MySQL / MariaDB | `mysql` | `mysql://user:pass@host:3306/db` |
| SQLite (local dev) | `sqlite` | `file:./databases/local.db` |
| MongoDB Atlas | `mongodb` | `mongodb+srv://user:pass@cluster.mongodb.net/db` |

> **MySQL note:** the `session` field on the Session model can exceed `varchar(191)`. If you see truncation errors, ALTER TABLE to TEXT after running `prisma migrate dev`.

> **MongoDB note:** `prisma migrate` is NOT supported. Use `prisma db push` instead.

### SQL Schema Models
| Model | Purpose |
|---|---|
| `Session` | Baileys signal-key state and credentials |
| `BaileysStore` | Persisted Baileys in-memory store snapshot (per session) |
| `PinterestProfilePicture` | Profile picture history entries |
| `UserLimit` | Per-user command limit and subscription role (`FREE`, `PREMIUM`, `OWNER`) |
| `BannedUser` | Globally banned WhatsApp JIDs |
| `Contact` | WhatsApp contact name cache |
| `GroupSettings` | Per-group settings (welcome, anti-link, etc.) |
| `DashboardSession` | Dashboard auth sessions (token/role/phone/expiry) |
| `DashboardAuditLog` | All admin actions logged |
| `DashboardBlocklist` | Blocked IPs/values |
| `DashboardOtp` | One-time passwords for owner login |
| `DashboardKV` | Generic key-value store (dashboard state + command catalog) |

### Commands
```sh
npm run db:generate        # prisma generate (SQL)
npm run db:push            # prisma db push (SQL)
npm run db:migrate         # prisma migrate dev (SQL)
npm run db:reset           # prisma migrate reset (SQL)
npm run db:studio         # prisma studio (visual DB browser)
npm run db:generate:mongo  # prisma generate --schema=prisma/schema.mongodb.prisma
npm run db:push:mongo     # prisma db push --schema=prisma/schema.mongodb.prisma
```

---

## CLI Flag Reference

Flag parsing via `meow` in `check-flag.js`. Flags added there are available in `configuration.OPTIONS`.

| Flag | Short | Description |
|---|---|---|
| `--prefix` | `-p` | Custom prefix(es), comma-separated for multiple |
| `--readOnly` | `-y` | Bot ignores all commands, reads chat only |
| `--autoRead` | `-r` | Auto read every incoming message |
| `--restrict` | `-e` | Ignore moderator commands (Add, Promote, Demote) |
| `--selfMode` | `-s` | Only owner and bot can use commands |
| `--debugMode` | `-g` | Show full message metadata in logs |
| `--multiCmd` | `-m` | Enable multi-cmd with `\|` separator |
| `--watch` | `-w` | Watch files and hot-reload on change |
| `--coolDown` | `-c` | Enable command cooldowns |
| `--ai` | `-i` | Handle messages with AI |
| `--limitReset` | `-l` | Auto-reset user limits |
| `--resetOnStart` | `-x` | Reset DB connections on start |
| `--noLimit` | `-u` | Disable command limits |
| `--pairMode` | `-z` | Pair number with code |
| `--pairNumber` | `-j` | Use specific number for pairing |
| `--story` | `-q` | Auto-download stories |
| `--offline` | `-f` | Set presence to offline |
| `--noCall` | `-d` | Reject incoming calls |
| `--printSelf` | `-v` | Print host's own messages in terminal |
| `--test` | | Test connection |
| `--help` | `-h` | Show help message |
| `--spin` | | Enable loading spinners |
| `--rainbow` | `-b` | Rainbow-colored logs |
| `--trace` | `-t` | Show errors |
| `--onlyLogs` | `-o` | Show logs only, ignore messages |
| `--noLogs` | `-n` | Suppress logs, still respond |

---

## Session
- Session name resolved from CLI arg or `settings.json.main_session` (default: `Session-debug`)
- Default session name derived in `check-flag.js:DEFAULT_SESSION_NAME` via sync `fs.readJSONSync`

---

## Running
- All-in-one: `node . <session_name> [--flags]`
- Bot only: `npm run start:bot`
- Dashboard only: `npm run start:dashboard`
- PM2 split: `npm run pm2:split`

---

## Important Files
- `src/helper/config/connect.js` — global config singleton, reads `settings.json`, holds `configuration.OPTIONS`, `configuration.cache`
- `src/helper/connection/utils/check-flag.js` — `parseCli()` via `meow`, exports `cli`. All CLI flags here
- `src/helper/config/settings.json` — bot config (prefix, owner, limits, etc.). Write via `fs.writeJSON` to persist
- `src/helper/groups/settings/group-default-settings.js` — `updateSettings()` updates group settings in DB, not settings.json

---

## Code Standards

### Core Philosophy
- Write code for humans first, machines second.
- Prioritize readability over cleverness.
- Optimize for maintainability, not ego.
- Assume another developer will debug this at 3 AM.
- Minimize cognitive load everywhere possible.
- Explicit is better than implicit.
- Simplicity beats abstraction unless it removes real duplication.
- If code needs a long explanation, the structure is probably wrong.

### Naming
- Variable names must describe intent, not implementation.
- Avoid abbreviations unless universally understood.
- Prefer longer clear names over short cryptic names.
- Boolean variables must read naturally: `isEnabled`, `hasPermission`, `canRetry`.

### Function Design
- Functions should do one thing only.
- Functions should be small enough to understand quickly.
- Avoid hidden side effects.
- Function names should describe behavior clearly.
- Prefer pure functions when possible.
- Avoid deep nesting; use early returns.

### Error Handling
- Never silently ignore errors.
- Every caught error must be handled, transformed, or logged properly.
- Never mix callback and promise styles — prefer async/await.
- Always handle promise rejections.
- Avoid sequential awaits when parallelism is safe.

### Logging
- Logs must be actionable.
- Logs must explain context.
- Never log meaningless messages.

### Comments
- Comments should explain *why*, not *what*.
- Do not comment obvious code.
- Remove outdated comments immediately.
- Do NOT add comments unless they clarify intent that cannot be expressed through code.
- Avoid ALL forms of comments: inline, block, banner, TODO, decorative.
- If the code requires comments to be understandable, rewrite the code instead.
- Prefer extracting logic into well-named functions instead of documenting with comments.
- Comments increase noise, maintenance burden, and code rot.
- Clean code communicates intent without relying on comments.
- Do not use comments as a substitute for bad naming or poor structure.

**Exceptions** — comments are allowed only for:
- Legal/license requirements
- Unavoidable edge-case explanations
- Extremely complex algorithms (when extraction is not feasible)
- Public API documentation when required by the framework
- Intentionally swallowing or ignoring errors (comment why it is safe to ignore)

### Code Validation
- Always verify every variable, function, class, import, and constant is defined before usage.
- Never reference undeclared variables or assume they exist implicitly.
- All identifiers must be declared, imported, passed as parameters, or available in scope.
- Before finalizing code, validate: variable scope, import correctness, function existence, async references, object property access.
- Avoid hidden globals or runtime side effects for variable creation.
- Prefer explicit dependency injection over implicit access.
- Ensure refactors do not leave orphaned references.
- Validate renamed variables across the entire file/project.
- Rule: if an identifier appears, its origin must be immediately obvious.

**Bad — `userData` is undefined:**
```js
processUser(userData);
```

**Good — `userData` is defined first:**
```js
const userData = await loadUserData();
processUser(userData);
```

**Bad — `message` is implicit:**
```js
logger.info(message);
```

**Good — `message` is explicit:**
```js
const message = 'Server started';
logger.info(message);
```

### API Design
- APIs should be hard to misuse.
- Validate inputs aggressively.
- Return predictable structures.

### Architecture
- One file should have one responsibility.
- Group files by feature, not by file type.
- Do not abstract prematurely.
- Duplicate twice before abstracting.
- Every abstraction must reduce complexity.
- Composition over inheritance.
- Design logic around reusable behavior, not single-screen behavior.
- Shared behavior should live in reusable hooks, utilities, components, or shared state handlers.
- Prefer parameters/options over copy-pasted variants.
- Every new method should be evaluated: Can this behavior exist elsewhere? Can it be generalized? Can it be configurable?
- Avoid tightly coupling logic to one page, route, component, or UI element.
- Build reusable logic for shared behavior, not isolated implementations for single screens.

**Bad — one-off methods for each screen:**
```js
function openUserProfileModal() {}
function openAdminProfileModal() {}
function openGuestProfileModal() {}
```

**Good — generic and configurable:**
```js
function openProfileModal(type) {}
```

### Performance
- Do not micro-optimize prematurely.
- Readability comes before tiny optimizations.
- Optimize only after measuring bottlenecks.

### Configuration
- Never hardcode secrets.
- Use environment variables for configurable values.
- Validate configuration on startup.
- Fail fast if configuration is invalid.

### Security
- Never trust user input.
- Sanitize all external data.
- Validate before processing.
- Principle of least privilege everywhere.

### Testing
- Test behavior, not implementation details.
- Tests should read like documentation.
- Keep tests deterministic; avoid flaky timing-based tests.

### Git
- Commit messages must explain intent.
- Use imperative mood.
- Do not include generated files or sensitive data in commits.

### Dependencies
- Every dependency adds maintenance cost.
- Prefer native APIs when reasonable.
- Avoid installing libraries for trivial tasks.

### Forbidden
- Magic numbers without explanation
- Silent failures
- Deep inheritance chains
- Massive god classes
- Hidden mutations
- Overengineered patterns
- Clever unreadable one-liners
- Excessive configuration layers
- Abstractions with single usage
- Global mutable state
