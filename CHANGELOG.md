# Changelog

All notable changes to this project will be documented in this file.

# 「6.12.1」2026-05-07
## Changed
- Implement a minimal port for the `in-memory store` connected to the Prisma database.
- Group settings management now uses the Prisma database.
- Pinterest album pictures are now persisted in the database.

## Fixed
- Fix the dashboard file tree view on mobile devices.
- `resetOnStart` now properly resets the active auth session, and both `loggedOut` and `badSession` errors now trigger a session reset.
- Interactive CLI authentication login now requires a TTY; otherwise, the default `host_number` is used.
- Named auth sessions are now properly wired to the CLI argument, with fallback values loaded from the config file when not provided.

## Refactor
- Complete the database migration process.


# 「6.12.0」2026-05-05
## Added
- `Editor` section for editing commands codes on the fly.

## Changed
- Refactored login approval flow to the dashboard: replaced global message event listener with a command-based trigger, eliminating unnecessary checks on unrelated messages.

## Refactor
- Cleaning unnecessary comments.
- Fix lint.

---

# 「6.11.0」2026-05-02
## Added
- Added Spotify `now-playing` widget exclusively for the dashboard. Please read this [repo](https://github.com/spotify/web-api-examples/tree/master/authorization/authorization_code) on how to authorize the widget. note: this authorization keys need a premium account to access the APIs.

## Fixed
- Database session.delete() on missing records.
- Image deleted from albums stays deleted.

## Removed
- Remove the redundant comments that was made by friends.

## Refactor
- Fixes code that makes ESLint happy.
---

# 「6.10.0」2026-04-28
## Added
- Added homepage and 404s handler.
- Filter images in `Album` by color dominant using `fast-average-color-node`.

## Changed
- Change the `Pinterest` response property name from `original` to `url` and the profile endpoint to adopt the same property, and removing the redundant property inside of the profile pictures entries.

---

# 「6.9.0」2026-04-22
## Changed
- Switch `Pinterest` responses and adapt it to the albums APIs entry.

---

# 「6.8.0」2026-04-21
## Added
- Added dashboard JavaScript minify pipeline with `uglify-js` and a dedicated build script.

## Changed
- Switched dashboard pages to load compiled assets from `public/dashboard/build`.
- Updated dashboard albums route handling to preload seamlessly through the main dashboard entry.
- Improved profile picture grid rendering to prefer original GIF sources.
- Expanded albums layout and carousel sizing for better desktop and mobile viewing.

## Fixed
- Synced profile picture delete state with server-returned picture lists when available.
- Reduced albums route flash by introducing preload class toggling during route transitions.

---

# 「6.7.1」2026-04-20
## Added
- Added seamless dashboard `Albums` route with in-dashboard navigation and integrated lightbox controls.
- Added iOS-style toggle controls for dashboard command and flag state switches.

## Changed
- Improved profile picture record handling to normalize `original` and `thumbnail` payload variants across dashboard and command outputs.
- Updated albums caching strategy to share profile picture cache state between dashboard and albums pages.

## Fixed
- Fixed owner-only delete visibility and action handling for profile pictures in seamless lightbox view.
- Fixed profile picture realtime updates to enforce consistent dashboard limits.
- Removed disable confirmation dialogs for command and flag toggles to align with switch interaction.

---

# 「6.7.0」2026-04-20
## Added
- Added dedicated dashboard `Albums` page with lightbox carousel, mobile gesture support, and cache-first loading.
- Added dashboard API support for profile picture albums with download/delete handlers and realtime update broadcasts.
- Added command usage tracking with persisted usage stats integration for dashboard monitoring.
- Added `Douyin` downloader command and utility parser export.
- Added richer dashboard changelog markdown rendering with section-style formatting and improved inline emphasis parsing.
- Added dashboard root-route behavior to redirect unauthenticated access to the login page.

## Changed
- Migrated dashboard session/audit/settings storage from `databases/groups` to `databases/dashboard`.
- Persisted and hydrated Pinterest profile picture history through JSON storage.
- Improved dashboard/login frontend navigation and perceived loading performance.
- Updated command handling and socket config typing to expose command-usage metrics consistently.
- Updated utility module exports to include `Douyin` parser wiring.
- Enhanced connection/server management with improved retry and startup stability behavior.
- Removed unused dashboard flagged-filter user control type and related UI wiring cleanup.

## Removed
- Removed legacy dashboard sessions storage file usage under `databases/groups` in favor of dashboard-scoped paths.

## Fixed
- Updated dashboard style color variables for more consistent select-element and separator rendering.

## Security
- Encrypted sensitive Instagram credentials when writing `.instagram.env` configuration values.

## Refactor
- Implemented graceful shutdown flow for manual/process exit signals.

---

# 「6.6.0」2026-04-16
## Added
- Added dashboard theme palette selector with persisted preference across sessions.
- Added logout confirmation dialog with animated states and loading feedback.
- Added login page theme toggle with animated icon morph and shared zen cursor behavior.

## Changed
- Refactored dashboard frontend into modular app files for constants, DOM bindings, formatters, and state.
- Updated dashboard and login visual theme system with expanded palette variables and cohesive color mapping.
- Updated chart line rendering to follow active theme colors dynamically.

## Security
- Redacted viewer-visible dashboard user identifiers while preserving full owner visibility.

---

# 「6.5.0」2026-04-16
## Added
- New web `Dashboard` with owner/viewer authentication, realtime status cards, live logs, and activity timeline.
- Dashboard controls for command toggles, runtime flags, user moderation, limit editing, and undo-capable actions.
- Dashboard UI pages with login flow, theme switching, changelog modal, contributors modal, and responsive layout.

## Changed
- Migrated dashboard server bootstrap from legacy `gradient` route to the new dashboard connection server.
- Extended command handling to respect dashboard-disabled commands and WhatsApp confirmation actions.
- Added persistent dashboard monitor state for disabled commands, flag states, sessions, and audit log tracking.

## Removed
- Removed legacy `gradient` server module wiring from runtime startup path.
- Removed tracked `nh_cookies` file from repository configuration assets.

---

# 「6.4.0」2026-04-14
## Added
- `Hi-Fi` downloader command for lossless Tidal downloads.
- New `Hi-Fi` utility module with Tidal API integration, manifest decoding, and FLAC metadata writer.

## Changed
- Migrated `Spotify` downloader internals from `DAB` to `Hi-Fi` provider.
- Updated utility exports to use `hi-fi` module path.

## Removed
- Legacy `DAB` downloader command and utility modules.

## Fixed
- Improved JID normalization with `remoteJidAlt` handling in message parsing flow.
- Exposed normalized user JID helper in instance utilities.
- Improved profile-picture update event handling for `@lid` mapping.

---

# 「6.3.1」2026-04-06
## Fixed
- Optimized `DAB` caching mechanism for URL and query handling.
- Updated bot naming references from `Void` to `Aestherix`.

## Refactor
- Updated ESLint rules and improved code structure in core utility modules.

---

# 「6.3.0」2025-12-10
## Fixed
- Updated `DAB` response parsing to support newer API format.
- Added decoder handling for new `DAB` API response payloads.

---

# 「6.2.0」2025-12-02
## Added
- Added `lid maps` and `pushName` to `mediaData` payload.
- Added caching for `lid maps`.

---

# 「6.1.0」2025-12-01
## Added
- Web screenshot now uses `pageres` module.

---

# 「6.0.2」2025-11-19
## Fixed
- `image_reverse_search`: uses `anilistInfo` params directly on Trace.moe API instead of external GraphQL request.

## Refactor
- Migrated environment loading from `dotenv` to `@dotenvx/dotenvx`.

## BREAKING!
- Changed how `TemplateBuilder` behaves.

---

# 「6.0.1」2025-11-10
## Fixed
- Updated gradient generator headless mode and required server-hosted launch arguments.

## Chore
- Updated bot naming cleanup from old `Void` reference.

---

# 「6.0.0」2025-11-08
## BREAKING!
- Drops node 18, and bump to 20 `(REQUIRED)`.

## Added
- Adds necessary `env` types.

## Fix
- `Telegram` stickers using other API.
- Migrating `Flickr` from breaking changes issues.

---

# 「5.16.2」2025-11-04
## Fixed
- Waits for `Internet` and `Vite` server side connection rather than exit (with `process.exit`) immediately.

---

# 「5.16.1」2025-11-02
## Fixed
- Fix `DAB` missing `quality` parameter causing error from the API end.

---

# 「5.16.0」2025-10-31
## Added
- Adds total commits count to `Changelog` command.

---

# 「5.15.0」2025-10-30
## Added
- `PM2` Utilities as a command. Type `{prefix}pm2 --help` to see further detail.

---

# 「5.14.2」2025-10-29
## Chore
- Adds `ai` property to `relay` method, and making `relayMessage` as `relay` and as standalone method in `instance` property 

---

# 「5.14.1」2025-10-29
## Fix
- Read `error` property of `Pixiv-art` responses rather than the `body.length` as it wasn't an array.
- Fetch `Spotify` alubm directly to download so it won't missed any track.
- Fix `falsy` statement on `DAB`'s downloader when indexing a number `0`.

---

# 「5.14.0」2025-10-23
## Added
- Adds ability to download Playlist, Album, and Single Track for `Spotifier`.

---

# 「5.13.0」2025-10-22
## Added
- Finishing the `wait` message.

## Fix
- Heic converter for `Tiktok`.
- Prevent `Instagram` initialization every startup.

## Refactor
- Change reply behavior.

---

# 「5.12.2」2025-10-21
## Added
- Shows `DAB`'s search responses if no index or id present.
- Adds ability to download from `DAB`'s search responses.
- Initialization for `wait` message using edit message rather than just stays waiting.
- Adds retry button if error occurred when using commands.

## Fixed
- Fix `dayjs` incorrectly renders timezone.
- Prevent `StubMessage` indexing property that could crash the app.

---

# 「5.12.1」2025-10-19
## Performance
- Added caching to reduce repeated requests to `DAB` Downloader.

---

# 「5.12.0」2025-10-18
## Added
- `DAB (Digital Audio Broadcasting)` Downloader, which are CD LOSSLESS type of audio you can stream and download.

## Chore
- Remove `heif-convert` package from installation script.

---

# 「5.11.0」2025-09-27
## Fix
- Adds `imagemagick` convert method support for `.heic` files for `Tiktok`.

---

# 「5.10.0」2025-09-26
## Added
- Send images sequence as `Template Carousel`.

---

# 「5.9.0」2025-09-26
## Added
- New ability to get list of images profile's sequence. 

---

# 「5.8.2」2025-09-26
## Fixed
- Prevent excessive tokenizer `YouTube.js` during startup.

---

# 「5.8.1」2025-09-26
## Fixed
- Fix `SpotifyCard` server.

---

# 「5.8.0」2025-09-25
## Performance
- Change `SpotifyCard` mesh background from node to server-side react app.

---

# 「5.7.0」2025-09-24
## Added
- Adding `Gradients` property to `GithubGraph` as a background.

---

# 「5.6.0」2025-09-24
## Performance
- Change `SpotifyCard` mesh background from headless to node.

---

# 「5.5.1」2025-09-21
## Chore
- Make the `menu` readable.

---

# 「5.5.0」2025-09-13
## Added
- Get similar images on Pinterest.
- `GithubGraph`: Added more color palettes.

## Fixed
- Crashes on missing message on StubType Property.
- Handles @lid for the group participants.
- Fix missing user's limit folder.
- Fix `generateMessageID` that would prevent sending messages to group, causing session failure.

## Chore
- Uncomment sending connected client message on host.

---

# 「5.4.1」2025-08-27
## Fixed
- Pass correct variable to `updateProfilePicture` function.

## Chore
- Bump [`aki-api@7.0.1`](https://www.npmjs.com/package/aki-api/v/7.0.1)
- Disable Akinator game to prevent request error during `npm install`

---

# 「5.4.0」2025-08-26
## Added
- Ability to accept multiple input on the `downloader` commands.
- Flags checks on the `Command(fetch)`
- New Flags (`--media/-m`) to the `Command(fetch)` to parse and download the link from the response directly.
- `Logging` for the downloader commands 

## Fixed
- `Pinterest`: Added the required `X-Pinterest-PWS-Handler` Header to `Search` and `Download` media.
- `Baileys`: Fix the ability to send buttons on most of the commands, using forked project.
- `Waifupic`: Rewriting the Native Template response.
- Fix `isURL` regex utility so it won't mistakenly match any Node/Web Buffer.
- Fix `H` flag regex so it doesn't conflicted with `H/Header` flag in the `Command(fetch)`
- Uses the Native Template builder on the `Error` handler in the incoming message event.

## Chore
- Applying the built-in WhatsApp Inline code span on the `usage` command property.
- Cleaning and working with the grammars for the `command examples`.

---

# 「5.3.1」2025-08-25
## Added
- `Spotifier`: Completing the API methods.
- `Twitter-dl`: Now includes GIF media type.

## Fixed
- `Wordle` game are now correctly follows the rule of the actual game.
- `3hentai & nhentai` commands should reply first before processing to PDF.
- Fix typo reading the filename in `trace-moe` module.
- `Tiktok`: Fix indexing on images url property.

## Chore
- Bump `colorthief` version to 2.6.0 to fix build on `npm install`

---

# 「5.3.0」2025-02-03
## Added
- `Bluesky`: Adding the ability to download bluesky posts.

---

# 「5.2.2」2024-11-09
## Refactor
- `Tiktok, Instagram`: Moved functions to a different file.

---

# 「5.2.1」2024-11-09
## Added
- `Tiktok, Instagram`: Adding Cache mechanism to the responses.

## Refactor
- Use optional chaining operator (`?.`) for safest guard clause rather than `in` keyword. 

---

# 「5.2.0」2024-11-06
## Added
- `Tiktok`: Ability to download highest resolution of a video.
- Adding a few `wait message` before processing a downloader.

---

# 「5.1.3」2024-11-05
## Fixed
- `Command(fetch)`: fix parser, and removing the quotation mark on the response string as it is not conventional.

## Chore
- Adding `CHANGELOG` Screenshot.

---

# 「5.1.2」2024-11-04
## Refactor
- Cleanups unused variables.

---

# 「5.1.1」2024-11-03
## Fixed
- `Facebook`: Scraping now using [`fdownloader.net`](https://fdownloader.net).
- Fix `loggers` on incoming messages event.
- Prevent reading `undefined` on Carousel.`getMessageType`.
- Kinda fixed the youtube downloader when client deployed on a server. Though it still have cloudflare on the end. Please use `youtubei.js`.

---

# 「5.1.0」2024-11-02
## Added
- `Spinner` when loading the plugins. Use `--spin` flag before running the client.

## Refactor
- `printBanner` should printed before connecting.
- `console.clear` should fired on start, and not before/after serilization of connections and plugins.

---

# 「5.0.9」2024-11-02
## Fixed
- `updateProfilePicture`, and improve cropping image using sharp.

---

# 「5.0.8」2024-10-31
## Fixed
- Cache Users and Groups.
- Handle groups events and sync the cache.
- `Waiting for this message` hopefully be fixed with this fix.

---

# 「5.0.7」2024-10-29
## Refactor
- Change function name to be more readable and make sense.

---

# 「5.0.6」2024-10-25
## Fixed
- Fix module validator. Now using `yup`.

---

# 「5.0.5」2024-10-24
## Fixed
- Fix `Carbon` border overweight on long codes. Now it's ACCURATE and symmetrically on both sides.

## Added
- New `Carbon` theme, `synthwave84`!

---

# 「5.0.4」2024-10-23
## Fixed
- Fix `Carbon` padding not accurately represents real height.

---

# 「5.0.3」2024-10-22
## Fixed
- Fix `Instagram` utilities:
   - `searchUser`: fix `user agent mismatch`.
   - `hashtag`: fix source `undefined`.
   - `highlights`: fix timeout on `fetchHighlight` function. now using chunked data.

## Added
- Logic to prevent plugins relogger trying to relog a file that has no `proper/valid properties`.
- Logic to prevent plugins has the same `name` to other plugins.
- New ability to download `Instagram hashtag` results. Reply to the result & Use `<prefix>igpost [number<1-n>]`.

## Removed
- Removing `spinnies`.

---

# 「5.0.2」2024-10-21
## Fixed
- Fix `Instagram story`.

---

# 「5.0.1」- 2024-10-21
## Fixed
- Fix `Instagram highlights`, and `post`.

---

# 「5.0.0」- 2024-10-20
## BREAKING!
- `Dropped Node.js version <18`: Many security risk on the older version, and may leaks performance.
- `Rewritten the prompt`: Change the `inquirer` prompt to `@inquirer/prompts` mainly because the legacy deps are not developed regularly.
- `Openai breaking changes on v4.`

## Added
- Logic to prevent `chokidar` from printing on the added files into the watch container.
- Introduced `AbortSignal.timeout` onto the prompt as it could take memory if you left them idle.
- Added `Spinners` into the plugins as a loading.
- Added more uploader [`catbox`](https://catbox.moe) and [`uguu`](https://uguu.se).
- Added script `instagram:login`. Add your `username` and `password` to .env, with `INSTAGRAM_USERNAME` and `INSTAGRAM_PASSWORD`, then run :
```sh
npm run instagram:login
```

## Removed
- Unused Fonts are being removed as it takes very big space.

## Fixed
- Fix `Instagram login`.
- Fix the `Nhentai` as per today they don't have CloudFlare enabled on their APIs.
- Fix 404 `Nhentai` with their image hosting domain.
- Fix the risk of memory leak cause by `@napi-rs/canvas`.
- Fix dead uploader ([`telegra.ph`](https://telegra.ph)), added more uploader as said above.
- Fix `WritableStream` on `imageToPdf` utility as it does not has event on `finish`
- Fix `eval` is not readable by bot causing it always print `boolean` on the body. Which is not as the behavior that was expected.
- Fix `SpotifyCard` is not properly render the text of the title and the song artists.