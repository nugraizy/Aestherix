# Documentations

## Table of Contents <a name='table'></a>
- [Additional Context](#additional-context)
- [Configuration](#configuration)
- [Prefix Modes](#prefix-modes)
- [Dashboard](#dashboard)
- [Environment Variables](#environment-variables)
- [Available Flags](#available-flags)

---

<br></br>

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


## Configuration

Edit settings in `src/helper/config/settings.json`. All keys are optional unless noted — the bot falls back to sensible defaults if a key is missing.

| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `main_host_number` | string | — | Primary host WhatsApp number (digits only, no JID suffix). |
| `backups_host_numbers` | string[] | `[]` | Secondary host numbers allowed to pair. |
| `owner_number` | string (JID) | — | Owner JID (e.g. `628xxx@s.whatsapp.net`). Receives owner-only commands. |
| `team_number` | string[] | `[]` | Extra JIDs treated as owners. |
| `state` | `public` \| `private` | `public` | `private` blocks non-owner command usage. |
| `maintenance` | boolean | `false` | When true, replies with a maintenance notice instead of running commands. |
| `main_session` | string | `Session-debug` | Default session name when none is passed on the CLI. |
| `max_group` | number | `20` | Max number of groups the bot will join. |
| `min_members` | number | `20` | Minimum members a group must have for some moderation features. |
| `limit` | number | `30` | Default per-user command limit per reset window. |
| `reset_time.minute` | string | `"6"` | Minute of the hour when daily limits reset. |
| `reset_time.hour` | string | `"00"` | Hour of the day (24h) when daily limits reset. |
| `tebak_gambar.expired_time` | number | `20` | Seconds before a Tebak Gambar round expires. |
| `prefix.multi` | boolean | `true` | Enable multi-prefix matching. See [Prefix Modes](#prefix-modes). |
| `prefix.nopref` | boolean | `false` | Treat every incoming message as a command. |
| `prefix.pref` | string | `"."` | Single-mode prefix, and base prefix for multi mode. |
| `prefix.customPrefixes` | string[] | `[]` | Extra characters appended to the multi-prefix set. |
| `debugger` | boolean | `false` | Verbose internal logs. |
| `logger_theme` | string | `catppuccin` | One of `dracula`, `synthwave`, `cyberpunk2077`, `catppuccin`. |
| `delay` | number | `2` | Global delay (seconds) between outgoing messages. |
| `best_time` | number | `1.638` | Target response latency used by the ping command. |

<div align='center'>
<a href='#table'>⬆️ Go Up</a>
</div>


## Prefix Modes

Prefix resolution obeys CLI flag > settings.json > defaults. Use whichever surface fits your workflow.

| Mode | When it triggers a command | Example |
| --- | --- | --- |
| **Single** | Message starts with `prefix.pref` | `.ping` |
| **Multi** | Message starts with `prefix.pref` *or* any char in `prefix.customPrefixes` | `!ping`, `.ping`, `#ping` |
| **No prefix** | Every message is evaluated as a command | `ping` |

Precedence order:

1. `--prefix <char,char,...>` on the CLI overrides everything. Comma-separated values enable multi mode automatically.
2. `prefix.multi: true` in settings.json → multi mode with `prefix.pref` plus `prefix.customPrefixes`.
3. `prefix.nopref: true` in settings.json → no-prefix mode.
4. Neither → single mode using `prefix.pref`.

If both `multi` and `nopref` are `true`, the bot logs a conflict warning and falls back to multi.

You can also change the mode live from the [Dashboard](#dashboard) under `Settings > Prefix`. Changes persist to settings.json via the Dashboard KV store.

<div align='center'>
<a href='#table'>⬆️ Go Up</a>
</div>


## Dashboard

Aestherix ships with an embedded Express + Socket.IO dashboard. Open `http://localhost:4000` by default (override with `DASHBOARD_PORT`).

### Running

| Command | Description |
| --- | --- |
| `npm run start` | Bot **and** embedded dashboard in one process. |
| `npm run start:dashboard` | Dashboard only, no bot. |
| `npm run pm2:split` | Bot and dashboard as separate PM2 apps. |

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

See [AGENTS.md](../AGENTS.md#dashboard) for REST endpoints, Socket.IO rooms, and implementation details.

<div align='center'>
<a href='#table'>⬆️ Go Up</a>
</div>


## Environment Variables

Copy `example.env` to `.env` and fill in what you need. The bot boots even if most are empty — only the database vars are strictly required.

### Database

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_PROVIDER` | ✅ | `postgresql` \| `mysql` \| `sqlite` \| `mongodb`. |
| `DATABASE_URL` | ✅ | Connection string for the chosen provider. |

### Dashboard

| Variable | Default | Description |
| --- | --- | --- |
| `DASHBOARD_PORT` | `4000` | HTTP port for the dashboard. |
| `DASHBOARD_EMBEDDED` | `1` | Set `0` to disable the embedded dashboard (used by PM2 split mode). |
| `DASHBOARD_BRIDGE_PORT` | `4010` | Port the embedded bot listens on for the standalone dashboard. |

### Scraper / API credentials

| Variable | Used by |
| --- | --- |
| `TWITTER_COOKIE` | Twitter commands (post download, user lookup, tweets, timeline, search). |
| `INSTAGRAM_SESI`, `INSTAGRAM_USERNAME`, `INSTAGRAM_PASSWORD` | Instagram commands and DM notifier. |
| `TELEGRAM_TOKEN` | Telegram integrations. |
| `OPENAI_KEY` | Character AI and AI completions. |
| `YOUTUBE_AUTH` | Authenticated YouTube actions. |
| `PINTEREST_COOKIE` | Pinterest scraper. |
| `WEATHER_KEY` | Weather command. |
| `ACR_HOST` | ACRCloud song identification. |
| `UBERDUCK_BASIC` | Uberduck text-to-speech. |
| `BING_COOKIE` | Bing integrations. |

<div align='center'>
<a href='#table'>⬆️ Go Up</a>
</div>


## Available Flags

Flags are kebab-case on the CLI. The bot reads them via [meow](https://github.com/sindresorhus/meow), which exposes them on `configuration.OPTIONS` as camelCase. Short letters are included where they exist.

| Flag | Short | Description |
| --- | --- | --- |
| `--prefix <char>` | `-p` | Custom prefix(es). Comma-separated to enable multi mode. |
| `--self-mode` | `-s` | Only owner and the bot itself can trigger commands. |
| `--multi-cmd` | `-m` | Run multiple commands per message with `&&` as separator. |
| `--watch` | `-w` | Hot-reload command files on change. |
| `--cool-down` | `-c` | Enforce command cooldowns. |
| `--limit-reset` | `-l` | Auto-reset per-user limits at `reset_time`. |
| `--help` | `-h` | Print help and exit. |
| `--read-only` | | Do not respond to commands; only read chat. |
| `--auto-read` | | Auto-read every incoming message. |
| `--restrict` | | Ignore moderator commands (Add, Promote, Demote). |
| `--only-logs` | | Only print logs; do not respond to commands. |
| `--no-logs` | | Suppress logs but still respond. |
| `--debug-mode` | | Log full message metadata. |
| `--auto-correct` | | Auto-correct mistyped command names. |
| `--rainbow` | | Rainbow-colored logs. |
| `--trace` | | Print error stack traces. |
| `--story` | | Auto-download contact stories. |
| `--offline` | | Set presence to offline. |
| `--no-call` | | Reject incoming calls. |
| `--ai` | | Handle incoming messages with the character AI. |
| `--reset-on-start` | | Reset DB connections on startup. |
| `--no-limit` | | Disable command limits globally. |
| `--pair-mode` | | Pair the host number via code instead of QR. |
| `--pair-number <num>` | | Use this number for pairing without a prompt. |
| `--test` | | Run connection self-test and exit. |
| `--print-self` | | Print host's own outgoing messages in the terminal. |
| `--pipe` | | Enable command piping with `\|` operator (chain command outputs). |

### Example

```sh
# multi-prefix bot with watch + cooldowns + no-logs, session name "mybot"
node . mybot --prefix "!,#,." --watch --cool-down --no-logs
```

<div align='center'>
<a href='#table'>⬆️ Go Up</a>
</div>
