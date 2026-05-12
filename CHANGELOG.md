# Changelog

All notable changes to this project will be documented in this file.

# 「6.14.0」2026-05-12
## Added
- **Werewolf game rewrite** — full modular architecture with scheduler-driven phase machine, 10 roles (Villager, Werewolf, Alpha Werewolf, Seer, Guard, Witch, Hunter, Cupid, Little Girl, Jester), lobby timer with auto-start/disband, button-based DM actions, i18n (id/en), and persistent sessions that survive bot restarts. ([`73b22c5`](https://github.com/nugraizy/aestherix/commit/73b22c5))
- **Werewolf test suite** — 184 tests covering session state, roles, balance, voting, win conditions, night resolution, phase machine, scheduler, lobby timer, full cycle (N=5–20), realistic flow with real timers, dispatcher, UI prompts/buttons, and i18n coverage. Tests moved to `__tests__/` root. ([`33e65bd`](https://github.com/nugraizy/aestherix/commit/33e65bd))
- **`findByPlayer` session lookup** — players can type night actions in DM without the roomId; the bot finds their active game automatically. ([`73b22c5`](https://github.com/nugraizy/aestherix/commit/73b22c5))
- **WerewolfSession** Prisma model for persisting in-flight games across restarts. ([`dbff4c6`](https://github.com/nugraizy/aestherix/commit/dbff4c6))

## Fixed
- **Cupid button pairing** — pressing a button in DM no longer fails because the group JID at `args[3]` was mis-parsed as a player index. ([`73b22c5`](https://github.com/nugraizy/aestherix/commit/73b22c5))
- **Dashboard** — werewolf session endpoints added; Interactive debug command formatting fixed. ([`b16fea8`](https://github.com/nugraizy/aestherix/commit/b16fea8))

## Refactored
- **`prepareSticker` API** — removed unused `filename` parameter; all converter commands updated to new `(media, type, exif)` signature. ([`8943b81`](https://github.com/nugraizy/aestherix/commit/8943b81))
- **Core message handling** — multi-cmd loop no longer mutates the shared message object; auth state uses write-conflict retry with exponential backoff; command loading and store persistence improved. ([`907b585`](https://github.com/nugraizy/aestherix/commit/907b585))

---

# 「6.13.1」2026-05-11
## Fixed
- **Dashboard owner OTP** no longer reports "Confirmation expired or not found" immediately after requesting a code, nor "Confirmation request mismatch" when tapping the WhatsApp button. `loadOtpStore` previously cleared the in-memory map on every call and reloaded from the DB asynchronously; a silent failure or a stale DB row would overwrite the freshly-created OTP. The loader now merges DB rows into the map and preserves any in-memory entry that is newer than the DB row, so an in-flight write can no longer get clobbered. `persistOtpStore` also stops swallowing upsert errors so any future failure shows up in the logs. ([`43beb90`](https://github.com/nugraizy/aestherix/commit/43beb90dbe9cc5866ddf0134f1ed8ed3187aca99))

---

# 「6.13.0」2026-05-11
## Added
- New `Comix` manga scraper module with five commands: search, detail, chapters, read, and popular. ([`e103cb6`](https://github.com/nugraizy/aestherix/commit/e103cb6e9335aaae70e943d1d51d2fa1671365da))
- New `Kiryuu` manga scraper module with five commands: search, detail, chapters, read, and popular. ([`9e0cde0`](https://github.com/nugraizy/aestherix/commit/9e0cde07b4177fefea17c5815635ad279446eb90))
- New Twitter commands: `twitter-tweets` (user timeline), `twitter-timeline` (home feed, owner-only), and `twitter-search`. ([`459d926`](https://github.com/nugraizy/aestherix/commit/459d92617cb65cf4eec928bc5c52b8a1e70e0edd))
- New `checkprefix` helper command that prints the current prefix configuration for operators. ([`cacee38`](https://github.com/nugraizy/aestherix/commit/cacee38be6f558d149812a407b68e37e579ee56a))
- Dashboard `Settings > Prefix` panel for configuring single / multi / no-prefix mode with custom prefix characters, persisted to `settings.json`. ([`f4e2b25`](https://github.com/nugraizy/aestherix/commit/f4e2b25f5edfbe5cbf6040399a79a8ac282759be))
- Syntax-highlighted plugin error reporting: failing source lines are rendered with `cli-highlight` using the active theme palette, with short AI-generated fix suggestions from a dedicated syntax-check agent. ([`d95dada`](https://github.com/nugraizy/aestherix/commit/d95dada618398b75f17157b41a1ec2013df49fa4))
- New CLI flags: `--pair-number` (pair without prompt), `--print-self` (echo host's own messages). ([`427f901`](https://github.com/nugraizy/aestherix/commit/427f901260d8a07077a17f12ee70e65fd5554bf1))
- `AGENTS.md` contributor guide covering project structure, architecture flow, command shape, and code standards. ([`83335ce`](https://github.com/nugraizy/aestherix/commit/83335cecf6716f9fb9aab82c4efb7b7e806f5811))

## Changed
- **Twitter scraper** rewritten as a class-based client with cookie auth and ClientTransaction request signing. Replaces the previous ad-hoc `twitterDownload` / `twitterUser` helpers. ([`459d926`](https://github.com/nugraizy/aestherix/commit/459d92617cb65cf4eec928bc5c52b8a1e70e0edd))
- **YouTube** switched to a unified `YouTubei.js` implementation. Dropped `ytdl-core` and the y2mate fallback, which were breaking frequently on upstream changes. ([`4b1a5be`](https://github.com/nugraizy/aestherix/commit/4b1a5be81088ae0e3cc74535dbe22c9db8e92b3e))
- **Character AI** client (`ChatGPTDialogue`) rewritten with positional constructor, agent mode support, and multi-message splitting via `{OTHER_MESSAGE}` markers. ([`7bb666d`](https://github.com/nugraizy/aestherix/commit/7bb666dacdd56a52e53b9d57a3353c55022b0055))
- **Prefix resolution** extracted into `src/helper/modules/prefix.js` exposing `cmdId()`, `getPrefix()`, and `setPrefix()`. Every hardcoded `!cmd` or `.cmd` button ID and rowId across commands and handlers now rebuilds with the active prefix at runtime. ([`cacee38`](https://github.com/nugraizy/aestherix/commit/cacee38be6f558d149812a407b68e37e579ee56a))
- **Anonymous partner matching** rewritten with explicit map accessors and atomic interval updates; the old flow called `Array.from(values().values)` (not a function) and had racey interval cleanup. ([`93a85c2`](https://github.com/nugraizy/aestherix/commit/93a85c2c8646cbe8bc4588afaca9f89907579503))
- **Command schema validation** now calls `schema.validateSync` with `run`, `name`, `usage`, `cooldown`, `limit`, `status`, and `category` marked required, so invalid plugins fail at load instead of silently registering with random defaults. ([`d95dada`](https://github.com/nugraizy/aestherix/commit/d95dada618398b75f17157b41a1ec2013df49fa4))
- **ESLint `camelcase`** rule relaxed to `{ properties: 'never' }` since third-party API payloads (Bandcamp, Pinterest, TikTok, Instagram, Twitter, Pexels, MiHoYo) ship snake_case properties the code has to mirror verbatim. Removed the resulting disable comments across scraper modules. ([`0e1fc1a`](https://github.com/nugraizy/aestherix/commit/0e1fc1a42b99d6a549fe6c549e5fff9e4219faf4))
- **Shutdown lifecycle** now disconnects socket.io clients, calls `closeAllConnections` / `closeIdleConnections`, and invokes new `shutdownDashboardKV` / `shutdownPinterestProfilePictures` hooks so pending flushes stop instead of racing the exit. ([`9829725`](https://github.com/nugraizy/aestherix/commit/9829725eb32a540c83fab78ce143f91fd1583c42))
- **Dashboard KV persistence** rewritten with a `flushInProgress` / `pendingFlush` guard pattern mirroring `makePersistentStore` and exponential backoff in `withRetry`. ([`9829725`](https://github.com/nugraizy/aestherix/commit/9829725eb32a540c83fab78ce143f91fd1583c42))
- **Interactive button handlers** renamed: `button.reminder` → `setReminder`, `button.cancel` → `cancelReminder`. `button.call` now takes `phoneNumber` instead of `id`. Unused `id` field removed from `reminder`, `cancel`, `address`, and `location`. ([`08869a0`](https://github.com/nugraizy/aestherix/commit/08869a000ccd34a931b712226aaece896df63b7e))
- **CLI flags** are now kebab-case on the command line (`--pair-mode`, `--self-mode`, `--read-only`, ...). meow maps them to camelCase in `configuration.OPTIONS`. Most single-letter aliases previously listed in the docs were removed since they never existed in code. ([`427f901`](https://github.com/nugraizy/aestherix/commit/427f901260d8a07077a17f12ee70e65fd5554bf1))
- **Help text and meow configuration** moved into the top-level `index.js` so the banner fires before module-level side effects. `check-flag.js` now only exports `DEFAULT_SESSION_NAME` and `meowFlags`, breaking a circular dependency with the configuration singleton. ([`427f901`](https://github.com/nugraizy/aestherix/commit/427f901260d8a07077a17f12ee70e65fd5554bf1))
- **Logger themes** (Catppuccin, Dracula, Cyberpunk, Synthwave) extended with syntax palette entries so code blocks in logs match the terminal theme. ([`d95dada`](https://github.com/nugraizy/aestherix/commit/d95dada618398b75f17157b41a1ec2013df49fa4))

## Fixed
- **Prefix multi-mode regex** now escapes character-class metacharacters in user prefixes, so commands with regex-sensitive prefix characters are matched correctly. ([`cacee38`](https://github.com/nugraizy/aestherix/commit/cacee38be6f558d149812a407b68e37e579ee56a))
- **`getWaifu`** passed axios the wrong argument shape, sending the headers object as the JSON body so the API received no exclude list. Now uses the three-arg axios form with the body in the right place, and drops the `new Promise(async ...)` wrapper that swallowed rejections thrown outside the inner try/catch. ([`e6dc8b1`](https://github.com/nugraizy/aestherix/commit/e6dc8b1b88a1a8044137ee018a88a8e089497723))
- **`imageToPdf`** crashed with "unknown image format" on webp buffers. Each input is now probed with sharp and transcoded to jpeg when needed. Pages also use each image's real dimensions instead of letterboxing everything into a fixed A4-ish size. ([`f78edbb`](https://github.com/nugraizy/aestherix/commit/f78edbb44e3b434a6ad5bcb5da3e20535a987a57))
- **`InteractiveButtons` type signatures** corrected. The previous `({ display: string, sections: Sections })` form was JS destructuring in a type position, not a valid parameter type. All entries now use `(params: { ... })`. ([`08869a0`](https://github.com/nugraizy/aestherix/commit/08869a000ccd34a931b712226aaece896df63b7e))
- **Own-message log spam** avoided — `isFromMe` messages now gate behind the new `--print-self` flag instead of always printing alongside the incoming message log. ([`cacee38`](https://github.com/nugraizy/aestherix/commit/cacee38be6f558d149812a407b68e37e579ee56a))
- **Character AI feedback loops** avoided by skipping AI replies on host-own messages. ([`7bb666d`](https://github.com/nugraizy/aestherix/commit/7bb666dacdd56a52e53b9d57a3353c55022b0055))
- **Profile picture rotation service** now also ignores `403` errors alongside the other transient responses, so one bad fetch no longer spams the logger. ([`83335ce`](https://github.com/nugraizy/aestherix/commit/83335cecf6716f9fb9aab82c4efb7b7e806f5811))

## Removed
- `ytdl-core` dependency (replaced by YouTubei.js). ([`4b1a5be`](https://github.com/nugraizy/aestherix/commit/4b1a5be81088ae0e3cc74535dbe22c9db8e92b3e))
- `src/utils/twitter/twitter-media-downloader.js` and `twitter-user-lookup.js` (folded into the new class-based client). ([`459d926`](https://github.com/nugraizy/aestherix/commit/459d92617cb65cf4eec928bc5c52b8a1e70e0edd))
- `src/utils/youtube/y2mate.js` (obsolete scraping fallback). ([`4b1a5be`](https://github.com/nugraizy/aestherix/commit/4b1a5be81088ae0e3cc74535dbe22c9db8e92b3e))

---

# 「6.12.2」2026-05-07
## Changed
- DashboardKV writes are now debounced and retried, with coalescing and debug logs. ([`a8e09e2`](https://github.com/nugraizy/aestherix/commit/a8e09e2))
- Baileys store and Pinterest history writes are queued to avoid conflicts. ([`a8e09e2`](https://github.com/nugraizy/aestherix/commit/a8e09e2))
- Store snapshots now flush on change and during graceful shutdown. ([`a8e09e2`](https://github.com/nugraizy/aestherix/commit/a8e09e2))
- CLI flags use camelCase, with updated docs and help text. ([`a8e09e2`](https://github.com/nugraizy/aestherix/commit/a8e09e2))
- Session name now falls back to config and default values when missing. ([`a8e09e2`](https://github.com/nugraizy/aestherix/commit/a8e09e2))
- Dashboard restart now reports PM2-only support with a clear toast message. ([`a8e09e2`](https://github.com/nugraizy/aestherix/commit/a8e09e2))

## Fixed
- `resetOnStart` now consistently clears the resolved auth session. ([`a8e09e2`](https://github.com/nugraizy/aestherix/commit/a8e09e2))
- Dashboard flag persistence no longer overrides explicit CLI flags. ([`a8e09e2`](https://github.com/nugraizy/aestherix/commit/a8e09e2))
- Restart failures now show the server-provided error message. ([`a8e09e2`](https://github.com/nugraizy/aestherix/commit/a8e09e2))
- Pinterest history persistence no longer deletes DB rows when the cache is empty. ([`a8e09e2`](https://github.com/nugraizy/aestherix/commit/a8e09e2))

# 「6.12.1」2026-05-07
## Changed
- Implement a minimal port for the `in-memory store` connected to the Prisma database. ([`497a334`](https://github.com/nugraizy/aestherix/commit/497a334))
- Group settings management now uses the Prisma database. ([`497a334`](https://github.com/nugraizy/aestherix/commit/497a334))
- Pinterest album pictures are now persisted in the database. ([`497a334`](https://github.com/nugraizy/aestherix/commit/497a334))

## Fixed
- Fix the dashboard file tree view on mobile devices. ([`497a334`](https://github.com/nugraizy/aestherix/commit/497a334))
- `resetOnStart` now properly resets the active auth session, and both `loggedOut` and `badSession` errors now trigger a session reset. ([`497a334`](https://github.com/nugraizy/aestherix/commit/497a334))
- Interactive CLI authentication login now requires a TTY; otherwise, the default `host_number` is used. ([`497a334`](https://github.com/nugraizy/aestherix/commit/497a334))
- Named auth sessions are now properly wired to the CLI argument, with fallback values loaded from the config file when not provided. ([`497a334`](https://github.com/nugraizy/aestherix/commit/497a334))

## Refactor
- Complete the database migration process. ([`497a334`](https://github.com/nugraizy/aestherix/commit/497a334))


# 「6.12.0」2026-05-05
## Added
- `Editor` section for editing commands codes on the fly. ([`68c39b5`](https://github.com/nugraizy/aestherix/commit/68c39b5))

## Changed
- Refactored login approval flow to the dashboard: replaced global message event listener with a command-based trigger, eliminating unnecessary checks on unrelated messages. ([`68c39b5`](https://github.com/nugraizy/aestherix/commit/68c39b5))

## Refactor
- Cleaning unnecessary comments. ([`68c39b5`](https://github.com/nugraizy/aestherix/commit/68c39b5))
- Fix lint. ([`68c39b5`](https://github.com/nugraizy/aestherix/commit/68c39b5))

---

# 「6.11.0」2026-05-02
## Added
- Added Spotify `now-playing` widget exclusively for the dashboard. Please read this [repo](https://github.com/spotify/web-api-examples/tree/master/authorization/authorization_code) on how to authorize the widget. note: this authorization keys need a premium account to access the APIs. ([`bedae5c`](https://github.com/nugraizy/aestherix/commit/bedae5c))

## Fixed
- Database session.delete() on missing records. ([`81b1d09`](https://github.com/nugraizy/aestherix/commit/81b1d09))
- Image deleted from albums stays deleted. ([`bedae5c`](https://github.com/nugraizy/aestherix/commit/bedae5c))

## Removed
- Remove the redundant comments that was made by friends. ([`bedae5c`](https://github.com/nugraizy/aestherix/commit/bedae5c))

## Refactor
- Fixes code that makes ESLint happy. ([`bedae5c`](https://github.com/nugraizy/aestherix/commit/bedae5c))
---

# 「6.10.0」2026-04-28
## Added
- Added homepage and 404s handler. ([`85466bb`](https://github.com/nugraizy/aestherix/commit/85466bb))
- Filter images in `Album` by color dominant using `fast-average-color-node`. ([`85466bb`](https://github.com/nugraizy/aestherix/commit/85466bb))

## Changed
- Change the `Pinterest` response property name from `original` to `url` and the profile endpoint to adopt the same property, and removing the redundant property inside of the profile pictures entries. ([`85466bb`](https://github.com/nugraizy/aestherix/commit/85466bb))

---

# 「6.9.0」2026-04-22
## Changed
- Switch `Pinterest` responses and adapt it to the albums APIs entry. ([`82f721a`](https://github.com/nugraizy/aestherix/commit/82f721a))

---

# 「6.8.0」2026-04-21
## Added
- Added dashboard JavaScript minify pipeline with `uglify-js` and a dedicated build script. ([`73737a2`](https://github.com/nugraizy/aestherix/commit/73737a2))

## Changed
- Switched dashboard pages to load compiled assets from `public/dashboard/build`. ([`73737a2`](https://github.com/nugraizy/aestherix/commit/73737a2))
- Updated dashboard albums route handling to preload seamlessly through the main dashboard entry. ([`73737a2`](https://github.com/nugraizy/aestherix/commit/73737a2))
- Improved profile picture grid rendering to prefer original GIF sources. ([`73b52e0`](https://github.com/nugraizy/aestherix/commit/73b52e0))
- Expanded albums layout and carousel sizing for better desktop and mobile viewing. ([`73b52e0`](https://github.com/nugraizy/aestherix/commit/73b52e0))

## Fixed
- Synced profile picture delete state with server-returned picture lists when available. ([`73b52e0`](https://github.com/nugraizy/aestherix/commit/73b52e0))
- Reduced albums route flash by introducing preload class toggling during route transitions. ([`73737a2`](https://github.com/nugraizy/aestherix/commit/73737a2))

---

# 「6.7.1」2026-04-20
## Added
- Added seamless dashboard `Albums` route with in-dashboard navigation and integrated lightbox controls. ([`a7da0d7`](https://github.com/nugraizy/aestherix/commit/a7da0d7))
- Added iOS-style toggle controls for dashboard command and flag state switches. ([`a7da0d7`](https://github.com/nugraizy/aestherix/commit/a7da0d7))

## Changed
- Improved profile picture record handling to normalize `original` and `thumbnail` payload variants across dashboard and command outputs. ([`a7da0d7`](https://github.com/nugraizy/aestherix/commit/a7da0d7))
- Updated albums caching strategy to share profile picture cache state between dashboard and albums pages. ([`a7da0d7`](https://github.com/nugraizy/aestherix/commit/a7da0d7))

## Fixed
- Fixed owner-only delete visibility and action handling for profile pictures in seamless lightbox view. ([`a7da0d7`](https://github.com/nugraizy/aestherix/commit/a7da0d7))
- Fixed profile picture realtime updates to enforce consistent dashboard limits. ([`a7da0d7`](https://github.com/nugraizy/aestherix/commit/a7da0d7))
- Removed disable confirmation dialogs for command and flag toggles to align with switch interaction. ([`a7da0d7`](https://github.com/nugraizy/aestherix/commit/a7da0d7))

---

# 「6.7.0」2026-04-20
## Added
- Added dedicated dashboard `Albums` page with lightbox carousel, mobile gesture support, and cache-first loading. ([`d01e030`](https://github.com/nugraizy/aestherix/commit/d01e030))
- Added dashboard API support for profile picture albums with download/delete handlers and realtime update broadcasts. ([`f9b268d`](https://github.com/nugraizy/aestherix/commit/f9b268d))
- Added command usage tracking with persisted usage stats integration for dashboard monitoring. ([`cfdbcb0`](https://github.com/nugraizy/aestherix/commit/cfdbcb0))
- Added `Douyin` downloader command and utility parser export. ([`32b3d46`](https://github.com/nugraizy/aestherix/commit/32b3d46))
- Added richer dashboard changelog markdown rendering with section-style formatting and improved inline emphasis parsing. ([`4db7922`](https://github.com/nugraizy/aestherix/commit/4db7922))
- Added dashboard root-route behavior to redirect unauthenticated access to the login page. ([`6e239c9`](https://github.com/nugraizy/aestherix/commit/6e239c9))

## Changed
- Migrated dashboard session/audit/settings storage from `databases/groups` to `databases/dashboard`. ([`f9b268d`](https://github.com/nugraizy/aestherix/commit/f9b268d))
- Persisted and hydrated Pinterest profile picture history through JSON storage. ([`07e63b4`](https://github.com/nugraizy/aestherix/commit/07e63b4))
- Improved dashboard/login frontend navigation and perceived loading performance. ([`0d22010`](https://github.com/nugraizy/aestherix/commit/0d22010))
- Updated command handling and socket config typing to expose command-usage metrics consistently. ([`cfdbcb0`](https://github.com/nugraizy/aestherix/commit/cfdbcb0))
- Updated utility module exports to include `Douyin` parser wiring. ([`32b3d46`](https://github.com/nugraizy/aestherix/commit/32b3d46))
- Enhanced connection/server management with improved retry and startup stability behavior. ([`0d22010`](https://github.com/nugraizy/aestherix/commit/0d22010))
- Removed unused dashboard flagged-filter user control type and related UI wiring cleanup. ([`7146c19`](https://github.com/nugraizy/aestherix/commit/7146c19))

## Removed
- Removed legacy dashboard sessions storage file usage under `databases/groups` in favor of dashboard-scoped paths. ([`f9b268d`](https://github.com/nugraizy/aestherix/commit/f9b268d))

## Fixed
- Updated dashboard style color variables for more consistent select-element and separator rendering. ([`4db7922`](https://github.com/nugraizy/aestherix/commit/4db7922))

## Security
- Encrypted sensitive Instagram credentials when writing `.instagram.env` configuration values. ([`08389e1`](https://github.com/nugraizy/aestherix/commit/08389e1))

## Refactor
- Implemented graceful shutdown flow for manual/process exit signals. ([`11a8b0a`](https://github.com/nugraizy/aestherix/commit/11a8b0a))

---

# 「6.6.0」2026-04-16
## Added
- Added dashboard theme palette selector with persisted preference across sessions. ([`99f9f21`](https://github.com/nugraizy/aestherix/commit/99f9f21))
- Added logout confirmation dialog with animated states and loading feedback. ([`e22cf3c`](https://github.com/nugraizy/aestherix/commit/e22cf3c))
- Added login page theme toggle with animated icon morph and shared zen cursor behavior. ([`e22cf3c`](https://github.com/nugraizy/aestherix/commit/e22cf3c))

## Changed
- Refactored dashboard frontend into modular app files for constants, DOM bindings, formatters, and state. ([`e22cf3c`](https://github.com/nugraizy/aestherix/commit/e22cf3c))
- Updated dashboard and login visual theme system with expanded palette variables and cohesive color mapping. ([`e22cf3c`](https://github.com/nugraizy/aestherix/commit/e22cf3c))
- Updated chart line rendering to follow active theme colors dynamically. ([`e22cf3c`](https://github.com/nugraizy/aestherix/commit/e22cf3c))

## Security
- Redacted viewer-visible dashboard user identifiers while preserving full owner visibility. ([`123e59d`](https://github.com/nugraizy/aestherix/commit/123e59d))

---

# 「6.5.0」2026-04-16
## Added
- New web `Dashboard` with owner/viewer authentication, realtime status cards, live logs, and activity timeline. ([`ae5bdd8`](https://github.com/nugraizy/aestherix/commit/ae5bdd8))
- Dashboard controls for command toggles, runtime flags, user moderation, limit editing, and undo-capable actions. ([`881c20b`](https://github.com/nugraizy/aestherix/commit/881c20b))
- Dashboard UI pages with login flow, theme switching, changelog modal, contributors modal, and responsive layout. ([`373c75e`](https://github.com/nugraizy/aestherix/commit/373c75e))

## Changed
- Migrated dashboard server bootstrap from legacy `gradient` route to the new dashboard connection server. ([`ae5bdd8`](https://github.com/nugraizy/aestherix/commit/ae5bdd8))
- Extended command handling to respect dashboard-disabled commands and WhatsApp confirmation actions. ([`373c75e`](https://github.com/nugraizy/aestherix/commit/373c75e))
- Added persistent dashboard monitor state for disabled commands, flag states, sessions, and audit log tracking. ([`ae5bdd8`](https://github.com/nugraizy/aestherix/commit/ae5bdd8))

## Removed
- Removed legacy `gradient` server module wiring from runtime startup path. ([`881c20b`](https://github.com/nugraizy/aestherix/commit/881c20b))
- Removed tracked `nh_cookies` file from repository configuration assets. ([`62a44fc`](https://github.com/nugraizy/aestherix/commit/62a44fc))

---

# 「6.4.0」2026-04-14
## Added
- `Hi-Fi` downloader command for lossless Tidal downloads. ([`be1acb0`](https://github.com/nugraizy/aestherix/commit/be1acb0))
- New `Hi-Fi` utility module with Tidal API integration, manifest decoding, and FLAC metadata writer. ([`be1acb0`](https://github.com/nugraizy/aestherix/commit/be1acb0))

## Changed
- Migrated `Spotify` downloader internals from `DAB` to `Hi-Fi` provider. ([`be1acb0`](https://github.com/nugraizy/aestherix/commit/be1acb0))
- Updated utility exports to use `hi-fi` module path. ([`be1acb0`](https://github.com/nugraizy/aestherix/commit/be1acb0))

## Removed
- Legacy `DAB` downloader command and utility modules. ([`be1acb0`](https://github.com/nugraizy/aestherix/commit/be1acb0))

## Fixed
- Improved JID normalization with `remoteJidAlt` handling in message parsing flow. ([`3043ef1`](https://github.com/nugraizy/aestherix/commit/3043ef1))
- Exposed normalized user JID helper in instance utilities. ([`3043ef1`](https://github.com/nugraizy/aestherix/commit/3043ef1))
- Improved profile-picture update event handling for `@lid` mapping. ([`3043ef1`](https://github.com/nugraizy/aestherix/commit/3043ef1))

---

# 「6.3.1」2026-04-06
## Fixed
- Optimized `DAB` caching mechanism for URL and query handling. ([`0786e25`](https://github.com/nugraizy/aestherix/commit/0786e25))
- Updated bot naming references from `Void` to `Aestherix`. ([`495609a`](https://github.com/nugraizy/aestherix/commit/495609a))

## Refactor
- Updated ESLint rules and improved code structure in core utility modules. ([`cd0eaf7`](https://github.com/nugraizy/aestherix/commit/cd0eaf7))

---

# 「6.3.0」2025-12-10
## Fixed
- Updated `DAB` response parsing to support newer API format. ([`988fd8c`](https://github.com/nugraizy/aestherix/commit/988fd8c))
- Added decoder handling for new `DAB` API response payloads. ([`988fd8c`](https://github.com/nugraizy/aestherix/commit/988fd8c))

---

# 「6.2.0」2025-12-02
## Added
- Added `lid maps` and `pushName` to `mediaData` payload. ([`ac8b6e5`](https://github.com/nugraizy/aestherix/commit/ac8b6e5))
- Added caching for `lid maps`. ([`ac8b6e5`](https://github.com/nugraizy/aestherix/commit/ac8b6e5))

---

# 「6.1.0」2025-12-01
## Added
- Web screenshot now uses `pageres` module. ([`d657d26`](https://github.com/nugraizy/aestherix/commit/d657d26))

---

# 「6.0.2」2025-11-19
## Fixed
- `image_reverse_search`: uses `anilistInfo` params directly on Trace.moe API instead of external GraphQL request. ([`272ada6`](https://github.com/nugraizy/aestherix/commit/272ada6))

## Refactor
- Migrated environment loading from `dotenv` to `@dotenvx/dotenvx`. ([`c9f1310`](https://github.com/nugraizy/aestherix/commit/c9f1310))

## BREAKING!
- Changed how `TemplateBuilder` behaves. ([`dbb0441`](https://github.com/nugraizy/aestherix/commit/dbb0441))

---

# 「6.0.1」2025-11-10
## Fixed
- Updated gradient generator headless mode and required server-hosted launch arguments. ([`a7127ae`](https://github.com/nugraizy/aestherix/commit/a7127ae))

## Chore
- Updated bot naming cleanup from old `Void` reference. ([`642f7d8`](https://github.com/nugraizy/aestherix/commit/642f7d8))

---

# 「6.0.0」2025-11-08
## BREAKING!
- Drops node 18, and bump to 20 `(REQUIRED)`. ([`a8950f2`](https://github.com/nugraizy/aestherix/commit/a8950f2))

## Added
- Adds necessary `env` types. ([`a8950f2`](https://github.com/nugraizy/aestherix/commit/a8950f2))

## Fix
- `Telegram` stickers using other API. ([`a8950f2`](https://github.com/nugraizy/aestherix/commit/a8950f2))
- Migrating `Flickr` from breaking changes issues. ([`a8950f2`](https://github.com/nugraizy/aestherix/commit/a8950f2))

---

# 「5.16.2」2025-11-04
## Fixed
- Waits for `Internet` and `Vite` server side connection rather than exit (with `process.exit`) immediately. ([`65dbafa`](https://github.com/nugraizy/aestherix/commit/65dbafa))

---

# 「5.16.1」2025-11-02
## Fixed
- Fix `DAB` missing `quality` parameter causing error from the API end. ([`1e33494`](https://github.com/nugraizy/aestherix/commit/1e33494))

---

# 「5.16.0」2025-10-31
## Added
- Adds total commits count to `Changelog` command. ([`85a0e05`](https://github.com/nugraizy/aestherix/commit/85a0e05))

---

# 「5.15.0」2025-10-30
## Added
- `PM2` Utilities as a command. Type `{prefix}pm2 --help` to see further detail. ([`407a9ae`](https://github.com/nugraizy/aestherix/commit/407a9ae))

---

# 「5.14.2」2025-10-29
## Chore
- Adds `ai` property to `relay` method, and making `relayMessage` as `relay` and as standalone method in `instance` property  ([`77a19dc`](https://github.com/nugraizy/aestherix/commit/77a19dc))

---

# 「5.14.1」2025-10-29
## Fix
- Read `error` property of `Pixiv-art` responses rather than the `body.length` as it wasn't an array. ([`5b2a76a`](https://github.com/nugraizy/aestherix/commit/5b2a76a))
- Fetch `Spotify` alubm directly to download so it won't missed any track. ([`2933e85`](https://github.com/nugraizy/aestherix/commit/2933e85))
- Fix `falsy` statement on `DAB`'s downloader when indexing a number `0`. ([`7ff6b28`](https://github.com/nugraizy/aestherix/commit/7ff6b28))

---

# 「5.14.0」2025-10-23
## Added
- Adds ability to download Playlist, Album, and Single Track for `Spotifier`. ([`39c70e7`](https://github.com/nugraizy/aestherix/commit/39c70e7))

---

# 「5.13.0」2025-10-22
## Added
- Finishing the `wait` message. ([`7554ee7`](https://github.com/nugraizy/aestherix/commit/7554ee7))

## Fix
- Heic converter for `Tiktok`. ([`7554ee7`](https://github.com/nugraizy/aestherix/commit/7554ee7))
- Prevent `Instagram` initialization every startup. ([`7554ee7`](https://github.com/nugraizy/aestherix/commit/7554ee7))

## Refactor
- Change reply behavior. ([`1898330`](https://github.com/nugraizy/aestherix/commit/1898330))

---

# 「5.12.2」2025-10-21
## Added
- Shows `DAB`'s search responses if no index or id present. ([`902d302`](https://github.com/nugraizy/aestherix/commit/902d302))
- Adds ability to download from `DAB`'s search responses. ([`902d302`](https://github.com/nugraizy/aestherix/commit/902d302))
- Initialization for `wait` message using edit message rather than just stays waiting. ([`902d302`](https://github.com/nugraizy/aestherix/commit/902d302))
- Adds retry button if error occurred when using commands. ([`902d302`](https://github.com/nugraizy/aestherix/commit/902d302))

## Fixed
- Fix `dayjs` incorrectly renders timezone. ([`9348e72`](https://github.com/nugraizy/aestherix/commit/9348e72))
- Prevent `StubMessage` indexing property that could crash the app. ([`902d302`](https://github.com/nugraizy/aestherix/commit/902d302))

---

# 「5.12.1」2025-10-19
## Performance
- Added caching to reduce repeated requests to `DAB` Downloader. ([`2a273c4`](https://github.com/nugraizy/aestherix/commit/2a273c4))

---

# 「5.12.0」2025-10-18
## Added
- `DAB (Digital Audio Broadcasting)` Downloader, which are CD LOSSLESS type of audio you can stream and download. ([`316939e`](https://github.com/nugraizy/aestherix/commit/316939e))

## Chore
- Remove `heif-convert` package from installation script. ([`28162da`](https://github.com/nugraizy/aestherix/commit/28162da))

---

# 「5.11.0」2025-09-27
## Fix
- Adds `imagemagick` convert method support for `.heic` files for `Tiktok`. ([`f60f33a`](https://github.com/nugraizy/aestherix/commit/f60f33a))

---

# 「5.10.0」2025-09-26
## Added
- Send images sequence as `Template Carousel`. ([`1e639c2`](https://github.com/nugraizy/aestherix/commit/1e639c2))

---

# 「5.9.0」2025-09-26
## Added
- New ability to get list of images profile's sequence.  ([`7c0206e`](https://github.com/nugraizy/aestherix/commit/7c0206e))

---

# 「5.8.2」2025-09-26
## Fixed
- Prevent excessive tokenizer `YouTube.js` during startup. ([`48078a9`](https://github.com/nugraizy/aestherix/commit/48078a9))

---

# 「5.8.1」2025-09-26
## Fixed
- Fix `SpotifyCard` server. ([`0fd8647`](https://github.com/nugraizy/aestherix/commit/0fd8647))

---

# 「5.8.0」2025-09-25
## Performance
- Change `SpotifyCard` mesh background from node to server-side react app. ([`d4a01b7`](https://github.com/nugraizy/aestherix/commit/d4a01b7))

---

# 「5.7.0」2025-09-24
## Added
- Adding `Gradients` property to `GithubGraph` as a background. ([`52c37ba`](https://github.com/nugraizy/aestherix/commit/52c37ba))

---

# 「5.6.0」2025-09-24
## Performance
- Change `SpotifyCard` mesh background from headless to node. ([`6c0ed8d`](https://github.com/nugraizy/aestherix/commit/6c0ed8d))

---

# 「5.5.1」2025-09-21
## Chore
- Make the `menu` readable. ([`3abca70`](https://github.com/nugraizy/aestherix/commit/3abca70))

---

# 「5.5.0」2025-09-13
## Added
- Get similar images on Pinterest. ([`e21ffd6`](https://github.com/nugraizy/aestherix/commit/e21ffd6))
- `GithubGraph`: Added more color palettes. ([`f08caeb`](https://github.com/nugraizy/aestherix/commit/f08caeb))

## Fixed
- Crashes on missing message on StubType Property. ([`e932f26`](https://github.com/nugraizy/aestherix/commit/e932f26))
- Handles @lid for the group participants. ([`df575a2`](https://github.com/nugraizy/aestherix/commit/df575a2))
- Fix missing user's limit folder. ([`e932f26`](https://github.com/nugraizy/aestherix/commit/e932f26))
- Fix `generateMessageID` that would prevent sending messages to group, causing session failure. ([`c152ed9`](https://github.com/nugraizy/aestherix/commit/c152ed9))

## Chore
- Uncomment sending connected client message on host. ([`c152ed9`](https://github.com/nugraizy/aestherix/commit/c152ed9))

---

# 「5.4.1」2025-08-27
## Fixed
- Pass correct variable to `updateProfilePicture` function. ([`eb1a09b`](https://github.com/nugraizy/aestherix/commit/eb1a09b))

## Chore
- Bump [`aki-api@7.0.1`](https://www.npmjs.com/package/aki-api/v/7.0.1) ([`d02bd7d`](https://github.com/nugraizy/aestherix/commit/d02bd7d))
- Disable Akinator game to prevent request error during `npm install` ([`25ea813`](https://github.com/nugraizy/aestherix/commit/25ea813))

---

# 「5.4.0」2025-08-26
## Added
- Ability to accept multiple input on the `downloader` commands. ([`062e69f`](https://github.com/nugraizy/aestherix/commit/062e69f))
- Flags checks on the `Command(fetch)` ([`062e69f`](https://github.com/nugraizy/aestherix/commit/062e69f))
- New Flags (`--media/-m`) to the `Command(fetch)` to parse and download the link from the response directly. ([`062e69f`](https://github.com/nugraizy/aestherix/commit/062e69f))
- `Logging` for the downloader commands  ([`062e69f`](https://github.com/nugraizy/aestherix/commit/062e69f))

## Fixed
- `Pinterest`: Added the required `X-Pinterest-PWS-Handler` Header to `Search` and `Download` media. ([`df97109`](https://github.com/nugraizy/aestherix/commit/df97109))
- `Baileys`: Fix the ability to send buttons on most of the commands, using forked project. ([`062e69f`](https://github.com/nugraizy/aestherix/commit/062e69f))
- `Waifupic`: Rewriting the Native Template response. ([`853021e`](https://github.com/nugraizy/aestherix/commit/853021e))
- Fix `isURL` regex utility so it won't mistakenly match any Node/Web Buffer. ([`df97109`](https://github.com/nugraizy/aestherix/commit/df97109))
- Fix `H` flag regex so it doesn't conflicted with `H/Header` flag in the `Command(fetch)` ([`062e69f`](https://github.com/nugraizy/aestherix/commit/062e69f))
- Uses the Native Template builder on the `Error` handler in the incoming message event. ([`853021e`](https://github.com/nugraizy/aestherix/commit/853021e))

## Chore
- Applying the built-in WhatsApp Inline code span on the `usage` command property. ([`062e69f`](https://github.com/nugraizy/aestherix/commit/062e69f))
- Cleaning and working with the grammars for the `command examples`. ([`062e69f`](https://github.com/nugraizy/aestherix/commit/062e69f))

---

# 「5.3.1」2025-08-25
## Added
- `Spotifier`: Completing the API methods. ([`016b747`](https://github.com/nugraizy/aestherix/commit/016b747))
- `Twitter-dl`: Now includes GIF media type. ([`4e87a7b`](https://github.com/nugraizy/aestherix/commit/4e87a7b))

## Fixed
- `Wordle` game are now correctly follows the rule of the actual game. ([`63b3828`](https://github.com/nugraizy/aestherix/commit/63b3828))
- `3hentai & nhentai` commands should reply first before processing to PDF. ([`63b3828`](https://github.com/nugraizy/aestherix/commit/63b3828))
- Fix typo reading the filename in `trace-moe` module. ([`bb2c18e`](https://github.com/nugraizy/aestherix/commit/bb2c18e))
- `Tiktok`: Fix indexing on images url property. ([`9f3b076`](https://github.com/nugraizy/aestherix/commit/9f3b076))

## Chore
- Bump `colorthief` version to 2.6.0 to fix build on `npm install` ([`63b3828`](https://github.com/nugraizy/aestherix/commit/63b3828))

---

# 「5.3.0」2025-02-03
## Added
- `Bluesky`: Adding the ability to download bluesky posts. ([`e357ec1`](https://github.com/nugraizy/aestherix/commit/e357ec1))

---

# 「5.2.2」2024-11-09
## Refactor
- `Tiktok, Instagram`: Moved functions to a different file. ([`6bc10c1`](https://github.com/nugraizy/aestherix/commit/6bc10c1))

---

# 「5.2.1」2024-11-09
## Added
- `Tiktok, Instagram`: Adding Cache mechanism to the responses. ([`5242f8a`](https://github.com/nugraizy/aestherix/commit/5242f8a))

## Refactor
- Use optional chaining operator (`?.`) for safest guard clause rather than `in` keyword.  ([`2597a78`](https://github.com/nugraizy/aestherix/commit/2597a78))

---

# 「5.2.0」2024-11-06
## Added
- `Tiktok`: Ability to download highest resolution of a video. ([`f563e02`](https://github.com/nugraizy/aestherix/commit/f563e02))
- Adding a few `wait message` before processing a downloader. ([`b1c4f54`](https://github.com/nugraizy/aestherix/commit/b1c4f54))

---

# 「5.1.3」2024-11-05
## Fixed
- `Command(fetch)`: fix parser, and removing the quotation mark on the response string as it is not conventional. ([`f2135c8`](https://github.com/nugraizy/aestherix/commit/f2135c8))

## Chore
- Adding `CHANGELOG` Screenshot. ([`f448357`](https://github.com/nugraizy/aestherix/commit/f448357))

---

# 「5.1.2」2024-11-04
## Refactor
- Cleanups unused variables. ([`f56a183`](https://github.com/nugraizy/aestherix/commit/f56a183))

---

# 「5.1.1」2024-11-03
## Fixed
- `Facebook`: Scraping now using [`fdownloader.net`](https://fdownloader.net). ([`1f0dcee`](https://github.com/nugraizy/aestherix/commit/1f0dcee))
- Fix `loggers` on incoming messages event. ([`17e1e63`](https://github.com/nugraizy/aestherix/commit/17e1e63))
- Prevent reading `undefined` on Carousel.`getMessageType`. ([`17e1e63`](https://github.com/nugraizy/aestherix/commit/17e1e63))
- Kinda fixed the youtube downloader when client deployed on a server. Though it still have cloudflare on the end. Please use `youtubei.js`. ([`17e1e63`](https://github.com/nugraizy/aestherix/commit/17e1e63))

---

# 「5.1.0」2024-11-02
## Added
- `Spinner` when loading the plugins. Use `--spin` flag before running the client. ([`af8ec29`](https://github.com/nugraizy/aestherix/commit/af8ec29))

## Refactor
- `printBanner` should printed before connecting. ([`8c42bbb`](https://github.com/nugraizy/aestherix/commit/8c42bbb))
- `console.clear` should fired on start, and not before/after serilization of connections and plugins. ([`8c42bbb`](https://github.com/nugraizy/aestherix/commit/8c42bbb))

---

# 「5.0.9」2024-11-02
## Fixed
- `updateProfilePicture`, and improve cropping image using sharp. ([`9e29689`](https://github.com/nugraizy/aestherix/commit/9e29689))

---

# 「5.0.8」2024-10-31
## Fixed
- Cache Users and Groups. ([`57a4e41`](https://github.com/nugraizy/aestherix/commit/57a4e41))
- Handle groups events and sync the cache. ([`57a4e41`](https://github.com/nugraizy/aestherix/commit/57a4e41))
- `Waiting for this message` hopefully be fixed with this fix. ([`a85129d`](https://github.com/nugraizy/aestherix/commit/a85129d))

---

# 「5.0.7」2024-10-29
## Refactor
- Change function name to be more readable and make sense. ([`69f41ea`](https://github.com/nugraizy/aestherix/commit/69f41ea))

---

# 「5.0.6」2024-10-25
## Fixed
- Fix module validator. Now using `yup`. ([`baa506e`](https://github.com/nugraizy/aestherix/commit/baa506e))

---

# 「5.0.5」2024-10-24
## Fixed
- Fix `Carbon` border overweight on long codes. Now it's ACCURATE and symmetrically on both sides. ([`7b37643`](https://github.com/nugraizy/aestherix/commit/7b37643))

## Added
- New `Carbon` theme, `synthwave84`! ([`7b37643`](https://github.com/nugraizy/aestherix/commit/7b37643))

---

# 「5.0.4」2024-10-23
## Fixed
- Fix `Carbon` padding not accurately represents real height. ([`d3350ad`](https://github.com/nugraizy/aestherix/commit/d3350ad))

---

# 「5.0.3」2024-10-22
## Fixed
- Fix `Instagram` utilities: ([`ae6a6dc`](https://github.com/nugraizy/aestherix/commit/ae6a6dc))
   - `searchUser`: fix `user agent mismatch`.
   - `hashtag`: fix source `undefined`.
   - `highlights`: fix timeout on `fetchHighlight` function. now using chunked data.

## Added
- Logic to prevent plugins relogger trying to relog a file that has no `proper/valid properties`. ([`42d004f`](https://github.com/nugraizy/aestherix/commit/42d004f))
- Logic to prevent plugins has the same `name` to other plugins. ([`42d004f`](https://github.com/nugraizy/aestherix/commit/42d004f))
- New ability to download `Instagram hashtag` results. Reply to the result & Use `<prefix>igpost [number<1-n>]`. ([`ae6a6dc`](https://github.com/nugraizy/aestherix/commit/ae6a6dc))

## Removed
- Removing `spinnies`. ([`42d004f`](https://github.com/nugraizy/aestherix/commit/42d004f))

---

# 「5.0.2」2024-10-21
## Fixed
- Fix `Instagram story`. ([`adcb5a5`](https://github.com/nugraizy/aestherix/commit/adcb5a5))

---

# 「5.0.1」- 2024-10-21
## Fixed
- Fix `Instagram highlights`, and `post`. ([`7c30bc7`](https://github.com/nugraizy/aestherix/commit/7c30bc7))

---

# 「5.0.0」- 2024-10-20
## BREAKING!
- `Dropped Node.js version <18`: Many security risk on the older version, and may leaks performance. ([`fbfcc41`](https://github.com/nugraizy/aestherix/commit/fbfcc41))
- `Rewritten the prompt`: Change the `inquirer` prompt to `@inquirer/prompts` mainly because the legacy deps are not developed regularly. ([`506eba4`](https://github.com/nugraizy/aestherix/commit/506eba4))
- `Openai breaking changes on v4.` ([`00d04c1`](https://github.com/nugraizy/aestherix/commit/00d04c1))

## Added
- Logic to prevent `chokidar` from printing on the added files into the watch container. ([`0681d7f`](https://github.com/nugraizy/aestherix/commit/0681d7f))
- Introduced `AbortSignal.timeout` onto the prompt as it could take memory if you left them idle. ([`506eba4`](https://github.com/nugraizy/aestherix/commit/506eba4))
- Added `Spinners` into the plugins as a loading. ([`0681d7f`](https://github.com/nugraizy/aestherix/commit/0681d7f))
- Added more uploader [`catbox`](https://catbox.moe) and [`uguu`](https://uguu.se). ([`a6619cf`](https://github.com/nugraizy/aestherix/commit/a6619cf))
- Added script `instagram:login`. Add your `username` and `password` to .env, with `INSTAGRAM_USERNAME` and `INSTAGRAM_PASSWORD`, then run : ([`3cee222`](https://github.com/nugraizy/aestherix/commit/3cee222))
```sh
npm run instagram:login
```

## Removed
- Unused Fonts are being removed as it takes very big space. ([`cb6dce5`](https://github.com/nugraizy/aestherix/commit/cb6dce5))

## Fixed
- Fix `Instagram login`. ([`69f8c76`](https://github.com/nugraizy/aestherix/commit/69f8c76))
- Fix the `Nhentai` as per today they don't have CloudFlare enabled on their APIs. ([`ef43434`](https://github.com/nugraizy/aestherix/commit/ef43434))
- Fix 404 `Nhentai` with their image hosting domain. ([`4bdf6ef`](https://github.com/nugraizy/aestherix/commit/4bdf6ef))
- Fix the risk of memory leak cause by `@napi-rs/canvas`. ([`1a7d08f`](https://github.com/nugraizy/aestherix/commit/1a7d08f))
- Fix dead uploader ([`telegra.ph`](https://telegra.ph)), added more uploader as said above. ([`a6619cf`](https://github.com/nugraizy/aestherix/commit/a6619cf))
- Fix `WritableStream` on `imageToPdf` utility as it does not has event on `finish` ([`0681d7f`](https://github.com/nugraizy/aestherix/commit/0681d7f))
- Fix `eval` is not readable by bot causing it always print `boolean` on the body. Which is not as the behavior that was expected. ([`b18c367`](https://github.com/nugraizy/aestherix/commit/b18c367))
- Fix `SpotifyCard` is not properly render the text of the title and the song artists. ([`2e12261`](https://github.com/nugraizy/aestherix/commit/2e12261))