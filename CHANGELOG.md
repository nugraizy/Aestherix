# Changelog

All notable changes to this project will be documented in this file.

# 「7.17.0」2026-06-23

## Added

- i18n namespaces for downloader, search, anime, converter, look_up, news, owner, helper, al-quran with en/id locale files ([`a42e77fc`](https://github.com/nugraizy/aestherix/commit/a42e77fc))
- Shared locale keys for buttons, footer, labels across all commands ([`a42e77fc`](https://github.com/nugraizy/aestherix/commit/a42e77fc))
- TypeScript types for all new i18n namespaces in `types.d.ts` ([`a42e77fc`](https://github.com/nugraizy/aestherix/commit/a42e77fc))
- `partnerFound` key for anonymous search per-partner locale ([`a42e77fc`](https://github.com/nugraizy/aestherix/commit/a42e77fc))
- `aiChatStarted` and `aiChatStopped` keys for char-ai command ([`a42e77fc`](https://github.com/nugraizy/aestherix/commit/a42e77fc))
- `example` key in `core.help` section ([`a42e77fc`](https://github.com/nugraizy/aestherix/commit/a42e77fc))
- Anime locale keys for `type`, `status`, `note`, `trackingInformation`, `animeInformation`, `days` ([`a42e77fc`](https://github.com/nugraizy/aestherix/commit/a42e77fc))

## Changed

- Refactor ~140 command files to use i18n locale keys instead of hardcoded strings ([`a42e77fc`](https://github.com/nugraizy/aestherix/commit/a42e77fc))
- Use `t()` with `{N}` interpolation for parametrized strings, `L.xxx` for static strings ([`a42e77fc`](https://github.com/nugraizy/aestherix/commit/a42e77fc))
- Move ` : ` separator from locale values to usage sites for cleaner labels ([`a42e77fc`](https://github.com/nugraizy/aestherix/commit/a42e77fc))
- Game files use `t()` instead of `L.game.xxx.replace('{0}', ...)` ([`a42e77fc`](https://github.com/nugraizy/aestherix/commit/a42e77fc))
- `core.dashboard.poweredBy` and `core.deleted.providedBy` now use `{0}` interpolation ([`a42e77fc`](https://github.com/nugraizy/aestherix/commit/a42e77fc))
- Anonymous search uses per-partner locale for "partner found" message ([`a42e77fc`](https://github.com/nugraizy/aestherix/commit/a42e77fc))
- Remove hardcoded `DAYS` constant from anime-schedule, use locale `days` object ([`a42e77fc`](https://github.com/nugraizy/aestherix/commit/a42e77fc))

## Fixed

- Sub-bot missing browser config causing view-once issues ([`63d42d60`](https://github.com/nugraizy/aestherix/commit/63d42d60))
- VoIP lint warnings in index.js and wasm-engine.js ([`f754d3f0`](https://github.com/nugraizy/aestherix/commit/f754d3f0))
- VoIP relay.js lint errors ([`a4e7abf6`](https://github.com/nugraizy/aestherix/commit/a4e7abf6))
- Anonymous skip/stop using hardcoded duplicate wait message ([`a42e77fc`](https://github.com/nugraizy/aestherix/commit/a42e77fc))

## Removed

- VoIP backup files (superseded by active voip stack) ([`a4e7abf6`](https://github.com/nugraizy/aestherix/commit/a4e7abf6))

# 「7.16.2」2026-06-21

## Fixed

- PM2 xvfb-run.sh using wrong session name causing repeated pairing prompt ([`6d076e95`](https://github.com/nugraizy/aestherix/commit/6d076e95))
- Dynamic browser selection in boot() restored after revert ([`6d076e95`](https://github.com/nugraizy/aestherix/commit/6d076e95))
- View-once media check using optional chaining for safer property access ([`9600e808`](https://github.com/nugraizy/aestherix/commit/9600e808))
- PM2 non-xvfb args no longer includes --no-sub flag ([`816b95b5`](https://github.com/nugraizy/aestherix/commit/816b95b5))
- Add missing viewonce field to group settings schema ([`01ad20f9`](https://github.com/nugraizy/aestherix/commit/01ad20f9))

# 「7.16.1」2026-06-21

## Added

- Dynamic browser selection for WhatsApp pairing (Safari) and normal operation (Android) ([`78964dba`](https://github.com/nugraizy/aestherix/commit/78964dba))
- Sub-bot pairing follows same browser selection flow ([`78964dba`](https://github.com/nugraizy/aestherix/commit/78964dba))
- Dynamic pino log level based on `--debug-mode` flag ([`78964dba`](https://github.com/nugraizy/aestherix/commit/78964dba))
- Stdin readline fallback for non-TTY pairing environments ([`78964dba`](https://github.com/nugraizy/aestherix/commit/78964dba))

## Fixed

- Filter placeholder phone numbers from pairing selection lists ([`78964dba`](https://github.com/nugraizy/aestherix/commit/78964dba))
- Undefined locale variable in group participant handler ([`78964dba`](https://github.com/nugraizy/aestherix/commit/78964dba))

# 「7.16.0」2026-06-21

## Added

- WhatsApp voice calling via WASM stack with InfiniteAPI signaling bridge ([`e057f76d`](https://github.com/nugraizy/aestherix/commit/e057f76d))
- `!call` command with audio control (pause/resume/audio source/remove) and call link join ([`e057f76d`](https://github.com/nugraizy/aestherix/commit/e057f76d))
- Per-user locale support via DMs with cache-first lookup ([`4d39c6cf`](https://github.com/nugraizy/aestherix/commit/4d39c6cf))
- Auto-moderation with warn/kick/delete actions ([`b825cfc2`](https://github.com/nugraizy/aestherix/commit/b825cfc2))
- Per-group custom aliases ([`b825cfc2`](https://github.com/nugraizy/aestherix/commit/b825cfc2))
- Moderation audit trail ([`b825cfc2`](https://github.com/nugraizy/aestherix/commit/b825cfc2))
- Slow mode manager ([`b825cfc2`](https://github.com/nugraizy/aestherix/commit/b825cfc2))
- Poll system with vote handler ([`b825cfc2`](https://github.com/nugraizy/aestherix/commit/b825cfc2))
- Reminder and scheduler systems ([`b825cfc2`](https://github.com/nugraizy/aestherix/commit/b825cfc2))
- Auto-reply manager ([`b825cfc2`](https://github.com/nugraizy/aestherix/commit/b825cfc2))
- View-once auto-decrypt with group setting toggle ([`b825cfc2`](https://github.com/nugraizy/aestherix/commit/b825cfc2))
- Command timeout (30s default) with Proxy firewall ([`b825cfc2`](https://github.com/nugraizy/aestherix/commit/b825cfc2))
- Circuit breaker for external API calls ([`b825cfc2`](https://github.com/nugraizy/aestherix/commit/b825cfc2))
- Reply chains with TTL ([`b825cfc2`](https://github.com/nugraizy/aestherix/commit/b825cfc2))
- `--enable-voip` flag to make VoIP opt-in ([`e057f76d`](https://github.com/nugraizy/aestherix/commit/e057f76d))
- Localized 50+ hardcoded strings across core, handlers, and commands ([`4d39c6cf`](https://github.com/nugraizy/aestherix/commit/4d39c6cf))
- `UserLocale` Prisma model for per-user language preference ([`4d39c6cf`](https://github.com/nugraizy/aestherix/commit/4d39c6cf))

## Fixed

- VoIP call rejection not clearing active call state ([`e057f76d`](https://github.com/nugraizy/aestherix/commit/e057f76d))
- Emscripten "Blocking on the main thread" warning suppression ([`e057f76d`](https://github.com/nugraizy/aestherix/commit/e057f76d))
- Command loader excluding eval on main bot when --skip-sub used ([`d244b61d`](https://github.com/nugraizy/aestherix/commit/d244b61d))
- Connection handler owner number validation for JID format ([`d244b61d`](https://github.com/nugraizy/aestherix/commit/d244b61d))
- Context isBotAdmin check for LID accounts ([`d244b61d`](https://github.com/nugraizy/aestherix/commit/d244b61d))
- Viewonce auto-decrypt proxy toString error ([`d244b61d`](https://github.com/nugraizy/aestherix/commit/d244b61d))
- Audio feeder choppy resume ([`e057f76d`](https://github.com/nugraizy/aestherix/commit/e057f76d))
- Log multiplexer skipSub key handling ([`d244b61d`](https://github.com/nugraizy/aestherix/commit/d244b61d))
- Empty file guard in command loader ([`d244b61d`](https://github.com/nugraizy/aestherix/commit/d244b61d))
- Ping command messageTimestamp latency ([`d244b61d`](https://github.com/nugraizy/aestherix/commit/d244b61d))
- Instagram post parser video_url fallback ([`d244b61d`](https://github.com/nugraizy/aestherix/commit/d244b61d))

## Changed

- VoIP init gated by `--enable-voip` flag ([`e057f76d`](https://github.com/nugraizy/aestherix/commit/e057f76d))
- `settings.json` default to placeholder phone numbers ([`360e7e17`](https://github.com/nugraizy/aestherix/commit/360e7e17))
- `example.env` defaults to SQLite ([`360e7e17`](https://github.com/nugraizy/aestherix/commit/360e7e17))
- Package scripts session name changed to `aestherix` ([`360e7e17`](https://github.com/nugraizy/aestherix/commit/360e7e17))
- Dashboard embedded mode logs connection ([`360e7e17`](https://github.com/nugraizy/aestherix/commit/360e7e17))
- Auto-moderation now enforces warn/kick/delete actions ([`b825cfc2`](https://github.com/nugraizy/aestherix/commit/b825cfc2))
- AFK locale strings corrected ([`4d39c6cf`](https://github.com/nugraizy/aestherix/commit/4d39c6cf))

# 「7.15.0」2026-06-17

## Added

- Connect Four game with AI opponent using minimax algorithm ([`0c1dee3e`](https://github.com/nugraizy/aestherix/commit/0c1dee3e))
- Trivia/Quiz game with i18n questions and button UI ([`0c1dee3e`](https://github.com/nugraizy/aestherix/commit/0c1dee3e))
- UNO card game (group only) with button hand display ([`0c1dee3e`](https://github.com/nugraizy/aestherix/commit/0c1dee3e))
- Minesweeper classic puzzle game with 3 difficulty levels ([`0c1dee3e`](https://github.com/nugraizy/aestherix/commit/0c1dee3e))
- Hangman word guessing game ([`0c1dee3e`](https://github.com/nugraizy/aestherix/commit/0c1dee3e))
- i18n generator: concurrent translation, progress saving, preview toggle ([`8e02d69d`](https://github.com/nugraizy/aestherix/commit/8e02d69d))

## Fixed

- Hangman trailing spaces in word database ([`0c1dee3e`](https://github.com/nugraizy/aestherix/commit/0c1dee3e))
- Trivia questions not loading from i18n ([`0c1dee3e`](https://github.com/nugraizy/aestherix/commit/0c1dee3e))
- Connect Four AI not responding ([`0c1dee3e`](https://github.com/nugraizy/aestherix/commit/0c1dee3e))
- i18n generator not handling arrays ([`8e02d69d`](https://github.com/nugraizy/aestherix/commit/8e02d69d))

## Changed

- Moved werewolf and hangman i18n to centralized location ([`5a9ac522`](https://github.com/nugraizy/aestherix/commit/5a9ac522))
- Reduced game cooldowns to 1s and removed usage limits ([`0c1dee3e`](https://github.com/nugraizy/aestherix/commit/0c1dee3e))

# 「7.14.2」2026-06-10

## Added

- Retry system with media cache, auto-disable after 3 failures, and owner enable button ([`bf34f079`](https://github.com/nugraizy/aestherix/commit/bf34f079))
- WebPMUX binary support for sticker EXIF with RIFF size fix and ffmpeg reliability improvements ([`bea35d21`](https://github.com/nugraizy/aestherix/commit/bea35d21))

## Changed

- Consolidate temp directory from src/media/temporary_files to ./tmp/ with TEMP_DIR constant ([`31b48695`](https://github.com/nugraizy/aestherix/commit/31b48695))
- Enable --pipe flag in production configs ([`2698d576`](https://github.com/nugraizy/aestherix/commit/2698d576))

# 「7.14.1」2026-06-09

## Fixed

- Prevent connectionReplaced on PM2 sub-bot startup by filtering owner commands and guarding src/index.js import ([`fe9142b0`](https://github.com/nugraizy/aestherix/commit/fe9142b0))
- Improve connection retry handling with delay and max retries, add non-primary guards ([`9ece4812`](https://github.com/nugraizy/aestherix/commit/9ece4812))
- Profile picture sync to PM2 sub-bots via PM2 programmatic API ([`fe9142b0`](https://github.com/nugraizy/aestherix/commit/fe9142b0))

## Changed

- Remove restart keybinding (R) from LogMultiplexer ([`debfffb4`](https://github.com/nugraizy/aestherix/commit/debfffb4))
- Replace console.log with structured logger in char-ai ([`9b5b5ae8`](https://github.com/nugraizy/aestherix/commit/9b5b5ae8))
- Remove verbose debug logging from boot and subbot ([`fe9142b0`](https://github.com/nugraizy/aestherix/commit/fe9142b0))

# 「7.14.0」2026-06-09

## Added

- LogMultiplexer with session-scoped loggers, terminal separation, and 12 keybindings ([`8e7b1cc2`](https://github.com/nugraizy/aestherix/commit/8e7b1cc2))
- Bot-status and bot-activate owner commands ([`31f2fa56`](https://github.com/nugraizy/aestherix/commit/31f2fa56))
- Sub-bot connection handling, session cleanup, and addbot rewrite ([`15d8bb92`](https://github.com/nugraizy/aestherix/commit/15d8bb92))
- Profile picture sync from main bot to sub-bots ([`6e434651`](https://github.com/nugraizy/aestherix/commit/6e434651))
- MangaToon class-based utility and search/detail/chapters/read commands ([`617efcfb`](https://github.com/nugraizy/aestherix/commit/617efcfb))
- Dashboard URL query handling unification with createQueryState and deep-linking ([`074b3572`](https://github.com/nugraizy/aestherix/commit/074b3572))

## Fixed

- stickerAble returning false for direct media with caption ([`d45adc1e`](https://github.com/nugraizy/aestherix/commit/d45adc1e))
- Dashboard a11y warnings and nerdfonts import ([`7df1bff9`](https://github.com/nugraizy/aestherix/commit/7df1bff9))
- Comix intercepted fetch response missing headers ([`d1f5da86`](https://github.com/nugraizy/aestherix/commit/d1f5da86))

## Changed

- Qobuz metadata cleanup — removed unused album parameter and pictureUrl ([`2c8e3526`](https://github.com/nugraizy/aestherix/commit/2c8e3526))
- Dashboard responsive CSS and ToolPanel hideHeader prop ([`e3789c4c`](https://github.com/nugraizy/aestherix/commit/e3789c4c))
- Removed unused tiktok-crypto vendor files ([`e1f2ef10`](https://github.com/nugraizy/aestherix/commit/e1f2ef10))

# 「7.13.0」2026-06-03

## Added

- AI chat tool with image vision support and session persistence ([`5e0f199`](https://github.com/nugraizy/aestherix/commit/5e0f199))
- File converter and currency converter tools ([`a2b5f6c`](https://github.com/nugraizy/aestherix/commit/a2b5f6c))

## Fixed

- Auth cookie secure flag now detected from request protocol ([`c120e44`](https://github.com/nugraizy/aestherix/commit/c120e44))
- CF solver cross-process communication in PM2 split mode ([`a855171`](https://github.com/nugraizy/aestherix/commit/a855171))

## Changed

- Redesigned calculator, color converter, QR generator, and timestamp converter ([`b168aa1`](https://github.com/nugraizy/aestherix/commit/b168aa1))
- Removed akinator game and fixed kiryuu-popular ([`23d164f`](https://github.com/nugraizy/aestherix/commit/23d164f))

# 「7.12.1」2026-06-01

## Added

- Authenticated YouTube innertube requests via cookies ([`5935d99`](https://github.com/nugraizy/aestherix/commit/5935d99))

## Changed

- Comix: reuse a warm browser and parallelize chapter and page fetching ([`c665ba6`](https://github.com/nugraizy/aestherix/commit/c665ba6))
- Center custom dashboard dropdowns when opened ([`7d32eee`](https://github.com/nugraizy/aestherix/commit/7d32eee))

# 「7.12.0」2026-05-31

## Added

- Native YouTube downloader: search, playlist, and audio/video downloads with quality/itag flags ([`8385273`](https://github.com/nugraizy/aestherix/commit/8385273))
- Dashboard YouTube downloader with playlist support in the tools tab ([`35a4629`](https://github.com/nugraizy/aestherix/commit/35a4629))

## Fixed

- Quoted-message participant and type are now resolved correctly ([`36e5a2c`](https://github.com/nugraizy/aestherix/commit/36e5a2c))

## Changed

- Rebuilt the about command with native buttons ([`686f3f5`](https://github.com/nugraizy/aestherix/commit/686f3f5))
- Removed the waifu2x and image-to-anime converters ([`f24cbe5`](https://github.com/nugraizy/aestherix/commit/f24cbe5))
- Dropped connect best-time tracking ([`042d68b`](https://github.com/nugraizy/aestherix/commit/042d68b))
- Renamed commands to kebab-case ([`8d970a7`](https://github.com/nugraizy/aestherix/commit/8d970a7))

# 「7.11.0」2026-05-30

## Added

- Comics reader: chapter bookmarks, page progress scrubber, auto-scroll with click pause, doom-scroll memory windowing, history filter, and shareable chapter URLs ([`c956f87`](https://github.com/nugraizy/aestherix/commit/c956f87))
- Cloudflare-challenge fallback for Kiryuu and Komikcast comic sources ([`e0126bc`](https://github.com/nugraizy/aestherix/commit/e0126bc))
- Dashboard preserves each page's URL params across navigation ([`e27f13d`](https://github.com/nugraizy/aestherix/commit/e27f13d))
- Dashboard auth session lifetime extended to 30 days ([`b962265`](https://github.com/nugraizy/aestherix/commit/b962265))

## Fixed

- Albums: clipboard copy fallback for non-secure origins, reliable tap-to-open on touch, and adjacent lightbox images now stay behind the main image on mobile ([`b957e83`](https://github.com/nugraizy/aestherix/commit/b957e83))

## Changed

- Albums load faster via a server-side profile-picture cache and pagination ([`d06c60c`](https://github.com/nugraizy/aestherix/commit/d06c60c))
- Light-mode tooltips use a white blurred background; smaller collapse/expand buttons on mobile ([`098e3f5`](https://github.com/nugraizy/aestherix/commit/098e3f5))

# 「7.10.0」2026-05-30

## Added

- Tools tab with Comics Reader and utility panels (calculator, color/JSON/timestamp converters, QR generator, downloader) ([`f416d6b`](https://github.com/nugraizy/aestherix/commit/f416d6b))
- Komikcast comic subcommands and JSON-API scraper rewrite ([`f6e1d30`](https://github.com/nugraizy/aestherix/commit/f6e1d30))
- Squiggly media slider and standardized custom tooltips on the dashboard ([`f031ced`](https://github.com/nugraizy/aestherix/commit/f031ced))
- Dashboard backend auth/socket and panel improvements ([`0419e85`](https://github.com/nugraizy/aestherix/commit/0419e85))

## Fixed

- Comics chapter totals now count distinct chapters and source pagination works across sorts ([`37df837`](https://github.com/nugraizy/aestherix/commit/37df837))
- Lightbox falls back to the thumbnail for HEIC images ([`7ee6fb5`](https://github.com/nugraizy/aestherix/commit/7ee6fb5))
- Instagram profile/highlights migrated to GraphQL endpoints ([`c8cf1b9`](https://github.com/nugraizy/aestherix/commit/c8cf1b9))
- Bilibili downloader rewritten with server-side ffmpeg merge ([`d436bcf`](https://github.com/nugraizy/aestherix/commit/d436bcf))
- Bandcamp, DeviantArt, MediaFire and TikTok scrapers repaired ([`78eec01`](https://github.com/nugraizy/aestherix/commit/78eec01))
- Core client-socket and message handler updates ([`4cd0617`](https://github.com/nugraizy/aestherix/commit/4cd0617))

## Changed

- Accent-colored scrollbars across the dashboard ([`9318846`](https://github.com/nugraizy/aestherix/commit/9318846))

# 「7.9.1」2026-05-28

## Added
- **Discord domain verification** — serve `dh=` token at `/.well-known/discord` via a scoped static mount that allows dotfiles only under `.well-known`. ([`84eaf24`](https://github.com/nugraizy/aestherix/commit/84eaf24))

## Fixed
- **Tab cache preservation** — Home and Controls now sit inside the shared page-cache pattern so visiting them no longer unmounts the lazy-loaded pages. Broadcast, System, FileEditor, and Groups gained a `loaded` guard so reactivation skips refetching and skeleton flashes. ([`e19e25d`](https://github.com/nugraizy/aestherix/commit/e19e25d))
- **Flags REST fallback** — `socket.js` now also fetches `/api/dashboard/flags` on connect, mirroring the existing commands fallback so FlagToggle's skeleton no longer hangs when the initial socket emit is empty or arrives before subscription. ([`0fddd24`](https://github.com/nugraizy/aestherix/commit/0fddd24))
- **Albums LRU cap** — profile pictures `list()` now reads directly from the database via the adapter instead of iterating `configuration.pinterest.images`, a 900-cap LRU shared with the bot's rotation. The cap previously limited responses to ~540 unique URLs even with thousands of rows in the DB. Delete also queries the DB so entries beyond the cache window can be removed. ([`e1af99a`](https://github.com/nugraizy/aestherix/commit/e1af99a))
- **Albums delete confirm** — `deletePicture` now uses the dashboard's `showConfirm` dialog instead of `window.confirm`. ([`17078be`](https://github.com/nugraizy/aestherix/commit/17078be))

## Improved
- **Lightbox toggle glyph** — replaced the U+22EE vertical ellipsis (which fell back to a tofu square because the bundled font subset lacks it) with three currentColor CSS circles in a fixed 18×18 flex container so the pill keeps a stable height when toggling. ([`59dcbe7`](https://github.com/nugraizy/aestherix/commit/59dcbe7))
- **Server entry tidy** — alphabetised the settings router/service imports and dropped an empty `mountGradient` guard left behind by an earlier refactor. ([`625cacb`](https://github.com/nugraizy/aestherix/commit/625cacb))

# 「7.9.0」2026-05-27

## Added
- **Lottie sticker support** — detect `lottieStickerMessage`, extract animation from ZIP, convert to video via Puppeteer + ffmpeg. ([`1ff3fb5`](https://github.com/nugraizy/aestherix/commit/1ff3fb5))
- **Spotify floating island** — redesigned widget as bottom-center pill with cava visualizer, hover marquee, and expandable modal. ([`1beaffe`](https://github.com/nugraizy/aestherix/commit/1beaffe))
- **Profile picture palette backfill** — automatically retry color extraction for entries missing palettes. ([`40098ad`](https://github.com/nugraizy/aestherix/commit/40098ad))

## Fixed
- **Dashboard auth prefix mismatch** — login confirmation buttons no longer depend on bot prefix; intercepts `dashauth:` responses directly in message handler. ([`a9fe5e5`](https://github.com/nugraizy/aestherix/commit/a9fe5e5))

## Improved
- **Dashboard audit fixes** — aria-labels, skip-nav link, touch targets 44px on mobile, pinned Coloris CDN v0.25.0 with SRI, LogViewer stable keys, Tooltip overflow-wrap, prefers-reduced-motion guard, Dropdown listener optimization, animated theme switch. ([`6af0851`](https://github.com/nugraizy/aestherix/commit/6af0851))

# 「7.8.4」2026-05-26

## Performance
- **Canvas sticker generation 3-6x faster** — replaced exec/disk I/O with in-memory node-webpmux, binary-search text layout replaces CanvasTextWrapper. ([`3cfaab5`](https://github.com/nugraizy/aestherix/commit/3cfaab5))
- **Trigger effect 3.5x faster** — skip GIF encoding, assemble animated webp directly from canvas frames. ([`55f1b64`](https://github.com/nugraizy/aestherix/commit/55f1b64))
- **GitHub contribution graph** — batched fillRect by color, cached date calculations, parallel year fetches. ([`39740f0`](https://github.com/nugraizy/aestherix/commit/39740f0))

## Added
- **WebGL mesh gradient** — Stripe-style gradient renderer using headless-gl with simplex noise shaders, replaces Puppeteer localhost dependency. ([`88653d8`](https://github.com/nugraizy/aestherix/commit/88653d8))
- **Standalone applyExif utility** — `src/helper/canvas/utils/exif.js` for sticker EXIF injection without client instance. ([`55f1b64`](https://github.com/nugraizy/aestherix/commit/55f1b64))
- **Font validation** — AnimatedSticker/StaticSticker now validate font names and list available fonts on mismatch. ([`39740f0`](https://github.com/nugraizy/aestherix/commit/39740f0))

## Refactored
- **src/utils/ restructured** — split modules/index.js into 9 focused files, normalized directory names, split god files (comix, converter, instagram), migrated 25 files from axios to undici. ([`ef86763`](https://github.com/nugraizy/aestherix/commit/ef86763))
- **Canvas module class-based** — all canvas generators converted to classes (AnimatedSticker, StaticSticker, TriggerEffect, MemeGenerator, TextStory, GitHubAPI), centralized themes and shared utils. ([`39740f0`](https://github.com/nugraizy/aestherix/commit/39740f0))
- **Removed gradient/ directory** — no longer needed, mesh gradient is in-process. ([`88653d8`](https://github.com/nugraizy/aestherix/commit/88653d8))

## Fixed
- **Typecheck error** — WAMessage type mismatch in wa_data/utils.js. ([`66c4b01`](https://github.com/nugraizy/aestherix/commit/66c4b01))
- **Test stalling** — load .env in contract tests so Prisma connects instead of hanging. ([`66c4b01`](https://github.com/nugraizy/aestherix/commit/66c4b01))
- **Comix image 404** — added fallback chain (/si/, /i/, /sii/, /ii/) matching Tachiyomi extension. ([`e3b4f89`](https://github.com/nugraizy/aestherix/commit/e3b4f89))
- **Comix descrambler black lines** — draw original image as background before tile rearrangement. ([`e3b4f89`](https://github.com/nugraizy/aestherix/commit/e3b4f89))
- **Manga reader cache** — shared singleton instances across all command files (comix, kiryuu, atsumaru, shinigami). ([`e3b4f89`](https://github.com/nugraizy/aestherix/commit/e3b4f89))
- **Chapter sort "Total: 0" bug** — use spread copy to avoid mutating cached arrays on sort toggle. ([`e3b4f89`](https://github.com/nugraizy/aestherix/commit/e3b4f89))
- **Chapter button labels** — remove redundant "Ch. N — Chapter N", show scanlator group in parentheses. ([`e3b4f89`](https://github.com/nugraizy/aestherix/commit/e3b4f89))
- **Kiryuu filename** — fix duplicate "chapter-chapter" in PDF filenames. ([`e3b4f89`](https://github.com/nugraizy/aestherix/commit/e3b4f89))

---

# 「7.8.3」2026-05-25

## Performance
- **Message dispatch fastpath** — profile flag, fire-and-forget trackUsage, void reject branches, reordered guard chain with owner short-circuit, parallel group cache, pre-warm at connect, stale-while-revalidate for non-command messages, cached keys for auto-correct. ([`6404da7`](https://github.com/nugraizy/aestherix/commit/6404da7))

## Added
- **Comix image descrambler** — ported LCG tile descrambler from keiyoushi PR #16139, auto-descrambles scrambled pages in getChapterPages. ([`297cf88`](https://github.com/nugraizy/aestherix/commit/297cf88))
- **Unified PDF filename** — all manga readers now use `{title}-chapter-{id}-{domain}.pdf` template with title lookup. ([`297cf88`](https://github.com/nugraizy/aestherix/commit/297cf88))
- **CI, tests, and docs scaffolding** — GitHub Actions workflow, test fixtures, contract tests, CONTRIBUTING.md, tsconfig, and documentation index. ([`2b6ca0c`](https://github.com/nugraizy/aestherix/commit/2b6ca0c))

---

# 「7.8.2」2026-05-24

## Added
- **Browser compatibility utility** — DNS-over-HTTPS (DoH) resolver and request emulation helper to improve network resiliency. ([`979b0a4`](https://github.com/nugraizy/aestherix/commit/979b0a4699b646cbe8bc4588afaca9f89907579503))
- **Comix Cloudflare bypass** — interactive Puppeteer stealth-based XHR interceptor and reload-per-page fallback for chapter pagination. ([`979b0a4`](https://github.com/nugraizy/aestherix/commit/979b0a4699b646cbe8bc4588afaca9f89907579503))

## Fixed
- **Dashboard bridge multi-instance** — resolve the first active client socket dynamically from the manager registry instead of using a hardcoded singleton. ([`c300569`](https://github.com/nugraizy/aestherix/commit/c300569dacdd56a52e53b9d57a3353c55022b0055))

## Performance
- **Dashboard optimization** — page-level lazy loading (dynamic Svelte page imports), Gzip response compression, static assets cache headers (`maxAge: 7d`), local Nerdfont asset preloading, and optimized websocket-only client transport. ([`1c5600d`](https://github.com/nugraizy/aestherix/commit/1c5600d1331c598a413dc7228b68101e817cebed))

---

# 「7.8.1」2026-05-21

## Added
- **Bridge fallback for PM2 split mode** — messages, groups, and logs now work in standalone dashboard mode. ([`2af4a36`](https://github.com/nugraizy/aestherix/commit/2af4a36))
- **File editor diff panel** — real-time LCS-based diff with syntax highlighting beside the editor. ([`d92e805`](https://github.com/nugraizy/aestherix/commit/d92e805))
- **Dashboard UX improvements** — human-readable error messages, login cooldown timer, album color palette tooltips, hold-to-preview, lightbox vertical dots, ANSI-colored logs, and easter egg. ([`a29a925`](https://github.com/nugraizy/aestherix/commit/a29a925))

## Fixed
- **Logs not appearing for superOwner** — role checks now include superOwner, logs use bridge in split mode, datetime stripped from log messages. ([`e0d63df`](https://github.com/nugraizy/aestherix/commit/e0d63df))
- **Audit log CPU spikes** — polling now only emits when new entries exist, interval increased to 5s. ([`e0d63df`](https://github.com/nugraizy/aestherix/commit/e0d63df))

## Refactored
- **ButtonPill component** — reusable pill button group used across Header, Editor, Groups, and UserList. ([`7b5b538`](https://github.com/nugraizy/aestherix/commit/7b5b538))

---

# 「7.8.0」2026-05-21

## Added
- **Dashboard admin UI** — new pages and management panels for the Svelte dashboard. ([`8e50d941`](https://github.com/nugraizy/aestherix/commit/8e50d941))
- **Dashboard APIs** — groups, system, and broadcast endpoints wired into the server. ([`f8fc326e`](https://github.com/nugraizy/aestherix/commit/f8fc326e))

## Refactored
- **Moderation settings** — split per-setting command handlers for group toggles. ([`3213f50a`](https://github.com/nugraizy/aestherix/commit/3213f50a))
- **Dashboard bridge** — refreshed core bridge and group settings caches. ([`6badc401`](https://github.com/nugraizy/aestherix/commit/6badc401))
- **Changelog header hash** — commit link moved into the changelog modal header. ([`78404cc4`](https://github.com/nugraizy/aestherix/commit/78404cc4))

## Chores
- **Prisma schemas** — aligned SQL and Mongo schema changes. ([`c9d93c96`](https://github.com/nugraizy/aestherix/commit/c9d93c96))
- **Dependencies** — refreshed package and lint configuration updates. ([`a4e33b8a`](https://github.com/nugraizy/aestherix/commit/a4e33b8a))

---

# 「7.7.4」2026-05-17

## Added
- **Chapter sort toggle** — atsumaru, comix, kiryuu, and shinigami chapter commands now have ascending/descending sort buttons with iOS button limit (18 per batch). ([`7d7b958`](https://github.com/nugraizy/aestherix/commit/7d7b958))

## Fixed
- **Global log removal** — replaced removed `log` global with `console.log` across 12 files. ([`12e20fb`](https://github.com/nugraizy/aestherix/commit/12e20fb))

## Performance
- **Comix token capture** — aggressive resource blocking (only document/script/XHR allowed) and early resolution on token intercept. ([`ffbea3f`](https://github.com/nugraizy/aestherix/commit/ffbea3f))

---

# 「7.7.3」2026-05-17

## Added
- **Dashboard rewrite** — `public/dashboard/` (~8k lines) and `src/core/dashboard/server.js` (~4k lines) replaced by a self-contained `dashboard/` workspace with a Svelte 5 + Vite frontend and a modular Express + Socket.IO backend split into routes/services/middleware/socket factories. Adds a 404 page, logout confirmation, animated sun/moon mode toggle, light-mode editor syntax colors, and a split-mode bot online indicator. ([`f9de7c8`](https://github.com/nugraizy/aestherix/commit/f9de7c8))
- **Bridge ping endpoint** — token-gated `GET /internal/dashboard/ping` on the bot bridge so the dashboard can detect bot-process state in PM2 split mode. ([`f9de7c8`](https://github.com/nugraizy/aestherix/commit/f9de7c8))
- **Manager-backed embedded client lookup** — `dashboard/server/lib/client.js` uses the v7 `Manager` registry instead of the removed `global.client.instance`, restoring embedded-mode runtime sync, blocking, and confirmation paths. ([`f9de7c8`](https://github.com/nugraizy/aestherix/commit/f9de7c8))
- **Pinterest color palette** — profile picture entries persist their dominant palette via a new `colorPalette` field on both schemas; `node-vibrant` replaces `fast-average-color-node`. ([`f9de7c8`](https://github.com/nugraizy/aestherix/commit/f9de7c8))
- **Gradient module** — extracted into `gradient/` with its own README; the dashboard mounts it by default and standalone deployments can opt out via `createDashboard({ mountGradient: false })`. ([`f9de7c8`](https://github.com/nugraizy/aestherix/commit/f9de7c8))
- **Prisma schema auto-selection** — `prisma.config.js` now resolves the schema file from `DATABASE_PROVIDER`, so `prisma generate` / `db push` / `migrate` / `studio` use `prisma/schema.mongodb.prisma` for `mongodb` and `prisma/schema.prisma` otherwise; the `:mongo` scripts remain as explicit overrides. ([`02bdebb`](https://github.com/nugraizy/aestherix/commit/02bdebb))

## Fixed
- **3hentai reply argument** — `client.reply` now receives the quoted message directly instead of the obsolete `{ from, quoted }` wrapper that no longer matches the v7 `ClientSocket.reply` signature. ([`830911b`](https://github.com/nugraizy/aestherix/commit/830911b))

---

# 「7.7.2」2026-05-16

## Fixed
- **Pipeline multi-media fan-out** — piping now forwards multiple media outputs and improves error logging around failed stages. ([`586beb1`](https://github.com/nugraizy/aestherix/commit/586beb1))
- **GitHub graph retry payload** — theme retry now uses the correct parsed username payload. ([`569d7f0`](https://github.com/nugraizy/aestherix/commit/569d7f0))
- **Context + group cache** — tightened cache resolution and context behavior for group data. ([`d2484d7`](https://github.com/nugraizy/aestherix/commit/d2484d7))
- **Client socket + command loader** — refined core updates for socket behavior and command loading. ([`40fc2b6`](https://github.com/nugraizy/aestherix/commit/40fc2b6))
- **Downloader commands** — adjusted downloader behaviors for updated flow. ([`5288936`](https://github.com/nugraizy/aestherix/commit/5288936))
- **Owner utilities** — updated owner command utilities to match current core expectations. ([`4402bc4`](https://github.com/nugraizy/aestherix/commit/4402bc4))

## Chores
- **Prototype typings** — synced prototype type definitions across shared surfaces. ([`11148e3`](https://github.com/nugraizy/aestherix/commit/11148e3))
- **Color utilities** — refreshed shared color helpers and palette handling. ([`9cd69dd`](https://github.com/nugraizy/aestherix/commit/9cd69dd))
- **Lockfile refresh** — updated dependency lockfile. ([`4906cfb`](https://github.com/nugraizy/aestherix/commit/4906cfb))

---

# 「7.7.1」2026-05-15

## Fixed
- **Dashboard commands empty** — `monitor.js` was reading from removed `configuration.cmds` path; updated to `configuration.registry` and synced commands from `CommandLoader` to `configuration.registry` in boot. ([`371c4c4`](https://github.com/nugraizy/aestherix/commit/371c4c4))

---

# 「7.7.0」2026-05-15

## Added
- **Execution lock** — heavy commands (Downloader, Converter, Search, AI, Anime) now acquire a per-user lock; concurrent heavy commands are blocked with a message. Auto-expires after 60s. ([`19a7c1a`](https://github.com/nugraizy/aestherix/commit/19a7c1a))
- **Pipeline fallback** — when a later pipe stage fails, the previous stage's output is still delivered to the user. ([`19a7c1a`](https://github.com/nugraizy/aestherix/commit/19a7c1a))
- **Character AI selection** — `!charai start <character>` lets users pick a character; `--chars` lists available characters. ([`35b3e83`](https://github.com/nugraizy/aestherix/commit/35b3e83))

## Fixed
- **Moderation commands** — restored missing `updateGroup` method on `ClientSocket` with new options object API; fixed broken `title`, `unlock`, `unrestrict` commands. ([`8d341da`](https://github.com/nugraizy/aestherix/commit/8d341da))
- **Missing `sendPresenceUpdate`** — added the method back to `ClientSocket` so `simulates` command works. ([`8d341da`](https://github.com/nugraizy/aestherix/commit/8d341da))

## Refactored
- **TikTok utility** — rewrote with 10-min TTL cache, flat class structure, removed lodash dependency, removed 4-level inheritance. ([`2f4c56b`](https://github.com/nugraizy/aestherix/commit/2f4c56b))
- **Owner commands** — refactored `banned`, `unbanned`, `eval`, `simulates`, `simulate-freegame`, `simulate-spotify-player`. ([`47d2a86`](https://github.com/nugraizy/aestherix/commit/47d2a86))
- **Moderation commands** — simplified all 11 moderation commands to use the new `updateGroup` options API. ([`8d341da`](https://github.com/nugraizy/aestherix/commit/8d341da))

---

# 「7.6.0」2026-05-15

## Added
- **Command piping** — chain command outputs using the `|` operator (e.g. `.igpost <url> | .sticker`). Supports media and text piping with guards for incompatible input, max depth 3, and per-stage cooldown/limit checks. Enabled via `--pipe` flag. ([`a1b93be`](https://github.com/nugraizy/aestherix/commit/a1b93be))

## Fixed
- **Animated webp to video** — fixed `convertStickerToMedia` producing empty buffers by using `node-webpmux` demux + sharp PNG frames instead of ffmpeg's broken animated webp decoder. Also added `ff.stdin` error handler to prevent unhandled crash in `prepareSticker`. ([`374b7df`](https://github.com/nugraizy/aestherix/commit/374b7df))
- **TikTok asyncRetry hang** — added `await` to `_mergeMediaResponse`, added `Promise.race` timeout (15s) to prevent hanging when `_getUserDetail` stalls, throw on soft errors so retry continues, removed invalid `maxRetryTime` option. ([`5ea54cb`](https://github.com/nugraizy/aestherix/commit/5ea54cb))

---

# 「7.5.0」2026-05-15

## Added
- **Multi-command separator change** — multi-command now uses `&&` instead of `|`, freeing `|` for future command piping. ([`7088781`](https://github.com/nugraizy/aestherix/commit/7088781))

## Refactored
- **Fetch helper rewrite** — removed lodash dependency, replaced with native path resolver, fixed variable shadowing and regex reuse bugs, extracted helpers with proper cleanup. ([`6786d3f`](https://github.com/nugraizy/aestherix/commit/6786d3f))
- **Instagram notifier removed** — removed instagram notifier module, handler, and owner command. ([`26c6f1d`](https://github.com/nugraizy/aestherix/commit/26c6f1d))
- **FFmpeg native spawn** — replaced `fluent-ffmpeg` with native `child_process.spawn` in video-to-sticker conversion. ([`1912817`](https://github.com/nugraizy/aestherix/commit/1912817))
- **Utils rewrite** — rewrote node-gtts, file-processing, and youtube utils; replaced `node-fetch` with `undici`. ([`8e8dd08`](https://github.com/nugraizy/aestherix/commit/8e8dd08))
- **Command cleanups** — updated comix, audio-book, eval imports; removed unused debugging commands (Bug, Sus). ([`566b65b`](https://github.com/nugraizy/aestherix/commit/566b65b))

## Chores
- **Dependency cleanup** — removed 20+ unused packages (`fluent-ffmpeg`, `node-fetch`, `instagram-private-api`, `cld`, `jsdom`, `g-i-s`, etc.), resolved peer dependency conflicts so `npm install` works without `--force`. ([`4a3ca1a`](https://github.com/nugraizy/aestherix/commit/4a3ca1a))

---

# 「7.4.1」2026-05-15

## Fixed
- **Genshin build card** — replaced nonexistent `wait.delete()` call in `!genshincard` with `wait.update()` showing a success message after the image is sent, and removed emoji noise from wait messages to match other commands. ([`a50495d`](https://github.com/nugraizy/aestherix/commit/a50495d))

## Added
- **Prototype types** — `src/types/Prototypes/index.d.ts` documents global `String`, `Array`, and `Number` prototype extensions used across the codebase. ([`a50495d`](https://github.com/nugraizy/aestherix/commit/a50495d))

---

# 「7.4.0」2026-05-14

## Added
- **Genshin Impact build card** — `!genshincard <uid>` generates an enka.network-style character build card with character splash, weapon, artifacts, stats, and constellations. Supports button-based character selection with 10-minute cache and optional `--radar` flag for hexagonal stats chart. ([`5d795d6`](https://github.com/nugraizy/aestherix/commit/5d795d6))

## Fixed
- **Prisma schema** — added missing `BotInstance` model and applied `sessionName` scoping with compound unique keys to `UserLimit`, `Contact`, `SettingsManager`, and `DashboardKV` for multi-instance support. ([`baea646`](https://github.com/nugraizy/aestherix/commit/baea646))
- **Profile picture rotation** — fixed iterator-to-array conversion so rotation history persists to database, and reordered `listPinterestProfilePictures` query to return the latest entries instead of the oldest. ([`638f759`](https://github.com/nugraizy/aestherix/commit/638f759))
- **Dashboard prefix change** — prefix updates from the dashboard now apply to the running router instead of requiring a restart. Multi-mode log now shows actual user prefixes, and `DashboardKV` queries use the correct compound key format. ([`03e8889`](https://github.com/nugraizy/aestherix/commit/03e8889))
- **Connection message** — bot only sends the "Bot is connected to socket" message on the first socket open, not on every reconnect. ([`4366bc7`](https://github.com/nugraizy/aestherix/commit/4366bc7))

---

# 「7.3.0」2026-05-14

## Fixed
- **Comix token capture** — resolve full manga slug from detail API, use puppeteer-extra stealth, stop blocking stylesheets. Chapters and manga results now cached. ([`43545b9`](https://github.com/nugraizy/aestherix/commit/43545b9))
- **iOS Carousel fallback** — Qobuz and TikTok commands send Native buttons or raw media on iOS devices. ([`31cc4d3`](https://github.com/nugraizy/aestherix/commit/31cc4d3))
- **Instagram init** — `isInstagramInitiated` checks `INSTAGRAM_USERNAME` and `INSTAGRAM_PASSWORD` env vars instead of OS `USERNAME`. ([`cb58ed7`](https://github.com/nugraizy/aestherix/commit/cb58ed7))

## Refactored
- **Configuration types** — full `Configuration` class type declaration with `InstagramApi` typed field. ([`cb58ed7`](https://github.com/nugraizy/aestherix/commit/cb58ed7))
- **Core improvements** — context, message handler, and command minor fixes. ([`d58a723`](https://github.com/nugraizy/aestherix/commit/d58a723))

---

# 「7.2.0」2026-05-13

## Added
- **Atsumaru manga scraper** — search, detail, chapters, and read commands with Typesense-based search API. ([`424c962`](https://github.com/nugraizy/aestherix/commit/424c962))
- **Shinigami manga scraper** — search, detail, chapters, and read commands with CDN-based page delivery. ([`39a4b4c`](https://github.com/nugraizy/aestherix/commit/39a4b4c))

---

# 「7.1.0」2026-05-13

## Added
- **Qobuz lossless downloader** — search, carousel UI, download by ID with ffmpeg metadata embedding and cover art. Track cache in utility for button-based flows. ([`be28ce2`](https://github.com/nugraizy/aestherix/commit/be28ce2))
- **Interactive `mentions()` method** — Native and Carousel builders support mentioning JIDs. ([`b21682e`](https://github.com/nugraizy/aestherix/commit/b21682e))
- **CLI early exit** — `--help` prints immediately without loading the bot. Unknown flags show "did you mean?" suggestions via string-similarity. ([`24c13d2`](https://github.com/nugraizy/aestherix/commit/24c13d2))

## Fixed
- **Werewolf lobby timer** — `initWerewolfHandler` now receives `ClientSocket` instead of raw Baileys socket, fixing timer callbacks. ([`e7bfc79`](https://github.com/nugraizy/aestherix/commit/e7bfc79))
- **Werewolf lobby mentions** — lobby prompts now mention players in the button message. ([`003f8a1`](https://github.com/nugraizy/aestherix/commit/003f8a1))

---

# 「7.0.0」2026-05-13

## BREAKING CHANGES
- **`client.instance` removed** — all commands now use `client.send()`, `client.reply()`, `client.TemplateBuilder` directly. External plugins using `client.instance.X` must update to `client.X`. ([`6a58b95`](https://github.com/nugraizy/aestherix/commit/6a58b95))
- **`MessageParser` renamed to `Context`** — `MessageParser.parse()` is now `Context.from()`. ([`6a58b95`](https://github.com/nugraizy/aestherix/commit/6a58b95))
- **Database schema** — `UserLimit`, `Contact`, `SettingsManager`, `DashboardKV` now have compound unique keys with `sessionName`. Requires `prisma db push`. ([`6a58b95`](https://github.com/nugraizy/aestherix/commit/6a58b95))
- **Configuration getters/setters removed** — `configuration.OPTIONS` → `.flags`, `configuration.cmds` → `.registry`, `configuration.user.limit` → `.userLimit`, `configuration.user.charAI` → `.charAI`, `configuration.expressInstances` → `.dashboard.expressInstances`, `configuration.dashboardIO` → `.dashboard.io`, `configuration.pinterestId` → `.pinterest.id`, `configuration.pinterestImages` → `.pinterest.images`, `configuration.anonymousMessages` → `.anonymous.messages`. ([`95b0346`](https://github.com/nugraizy/aestherix/commit/95b0346))

## Added
- **Multi-instance support** — `!addbot`, `!removebot`, `!listbots`, `!botflags` commands. Sub-bots run in the same process with restricted permissions. Auto-spawns persisted sub-bots on startup. ([`6a58b95`](https://github.com/nugraizy/aestherix/commit/6a58b95))
- **`BotInstance` Prisma model** — persists sub-bot sessions, flags, and active state. ([`6a58b95`](https://github.com/nugraizy/aestherix/commit/6a58b95))
- **Context convenience methods** — `ctx.reply()`, `ctx.react()`, `ctx.send()`, `ctx.sendTo()`, `ctx.delete()`. ([`6a58b95`](https://github.com/nugraizy/aestherix/commit/6a58b95))
- **ClientSocket proxy methods** — `client.profilePictureUrl()`, `client.groupMetadata()`, `client.fetchBlocklist()`, `client.readMessages()`, `client.user`, `client.authState`. ([`6a58b95`](https://github.com/nugraizy/aestherix/commit/6a58b95))
- **Core types** — `src/types/Core/index.d.ts` with full type definitions for all core classes. ([`6a58b95`](https://github.com/nugraizy/aestherix/commit/6a58b95))
- **Graceful shutdown** — SIGINT/SIGTERM handler closes all sockets, dashboard, and bridge. ([`6a58b95`](https://github.com/nugraizy/aestherix/commit/6a58b95))
- **Pairing flow** — interactive number selection (default → list → manual input). ([`6a58b95`](https://github.com/nugraizy/aestherix/commit/6a58b95))
- **Comix scraper updated** — dynamic token capture via puppeteer, new `baseUrl` + relative page URLs, deduplication prefers official/group 10702, new filters (content_rating, formats, tags search). ([`5967e21`](https://github.com/nugraizy/aestherix/commit/5967e21))
- **Logger `.json()` method** — `format` (indentation) and `pretty` (syntax highlighting) as independent options with theme support. ([`5967e21`](https://github.com/nugraizy/aestherix/commit/5967e21))
- **Qobuz lossless downloader** — search, carousel UI, download by ID with ffmpeg metadata embedding and cover art. Track cache in utility for button-based flows. ([`be28ce2`](https://github.com/nugraizy/aestherix/commit/be28ce2))
- **Interactive `mentions()` method** — Native and Carousel builders support mentioning JIDs. ([`b21682e`](https://github.com/nugraizy/aestherix/commit/b21682e))
- **CLI early exit** — `--help` prints immediately without loading the bot. Unknown flags show "did you mean?" suggestions via string-similarity. ([`24c13d2`](https://github.com/nugraizy/aestherix/commit/24c13d2))

## Performance
- **Store init non-blocking** — socket connects while store hydrates in background (33s → 6s startup). ([`6a58b95`](https://github.com/nugraizy/aestherix/commit/6a58b95))
- **Auth key writes batched** — dirty keys flushed every 10s instead of per-write, eliminates MongoDB write conflicts. ([`6a58b95`](https://github.com/nugraizy/aestherix/commit/6a58b95))

## Refactored
- **`src/helper/modules/utils.js` deleted** (1200+ lines) — all `assign()` methods moved to `ClientSocket` class. ([`6a58b95`](https://github.com/nugraizy/aestherix/commit/6a58b95))
- **`src/index.js` slimmed** (554 → 84 lines) — dashboard bridge and profile picture service extracted to `src/core/services/`. ([`a7066c7`](https://github.com/nugraizy/aestherix/commit/a7066c7))
- **Root `index.js` rewritten** (130 → 39 lines) — env, banner, import. ([`a7066c7`](https://github.com/nugraizy/aestherix/commit/a7066c7))
- **Logger consolidated** — old `loggers` object replaced with `Logger` class instance. ([`6a58b95`](https://github.com/nugraizy/aestherix/commit/6a58b95))
- **Auth state moved** — `src/helper/database/auth.js` → `src/core/auth-state.js`. ([`6a58b95`](https://github.com/nugraizy/aestherix/commit/6a58b95))
- **Dead code deleted** — old `src/handlers/`, `src/helper/connection/` directories removed. ([`6a58b95`](https://github.com/nugraizy/aestherix/commit/6a58b95))
- **Configuration class** — removed all legacy getters/setters, direct property access only. ([`95b0346`](https://github.com/nugraizy/aestherix/commit/95b0346))

## Fixed
- **Dashboard import paths** — `server.js` and `monitor.js` corrected to `../../helper/database/adapters/`. ([`6a58b95`](https://github.com/nugraizy/aestherix/commit/6a58b95))
- **Prisma runtime URL** — `datasourceUrl` passed explicitly for dotenvx compatibility. ([`6a58b95`](https://github.com/nugraizy/aestherix/commit/6a58b95))
- **Context null guards** — `decodeJid`, store access, and `#ensureUserCache` handle undefined gracefully. ([`6a58b95`](https://github.com/nugraizy/aestherix/commit/6a58b95))
- **MQTT typo** — `waclient` → `waClient`. ([`6a58b95`](https://github.com/nugraizy/aestherix/commit/6a58b95))
- **`resetSession`** — prefix now matches `fixFileName` format used by auth-state. ([`6a58b95`](https://github.com/nugraizy/aestherix/commit/6a58b95))
- **Comix chapters button limit** — capped at 19 per batch + 1 navigation button to stay within WhatsApp's 20-button max. ([`5967e21`](https://github.com/nugraizy/aestherix/commit/5967e21))
- **Werewolf lobby timer** — `initWerewolfHandler` now receives `ClientSocket` instead of raw Baileys socket, fixing timer callbacks. ([`e7bfc79`](https://github.com/nugraizy/aestherix/commit/e7bfc79))
- **Werewolf lobby mentions** — lobby prompts now mention players in the button message. ([`003f8a1`](https://github.com/nugraizy/aestherix/commit/003f8a1))

---

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