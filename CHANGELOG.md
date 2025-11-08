# Changelog

All notable changes to this project will be documented in this file.

# ࿎「6.0.0」2025-11-08
## BREAKING!
- Drops node 18, and bump to 20 `(REQUIRED)`.

## Added
- Adds necessary `env` types.

## Fix
- `Telegram` stickers using other API.
- Migrating `Flickr` from breaking changes issues.

---

# ࿎「5.16.2」2025-11-04
## Fixed
- Waits for `Internet` and `Vite` server side connection rather than exit (with `process.exit`) immediately.

---

# ࿎「5.16.1」2025-11-02
## Fixed
- Fix `DAB` missing `quality` parameter causing error from the API end.

---

# ࿎「5.16.0」2025-10-31
## Added
- Adds total commits count to `Changelog` command.

---

# ࿎「5.15.0」2025-10-30
## Added
- `PM2` Utilities as a command. Type `{prefix}pm2 --help` to see further detail.

---

# ࿎「5.14.2」2025-10-29
## Chore
- Adds `ai` property to `relay` method, and making `relayMessage` as `relay` and as standalone method in `instance` property 

---

# ࿎「5.14.1」2025-10-29
## Fix
- Read `error` property of `Pixiv-art` responses rather than the `body.length` as it wasn't an array.
- Fetch `Spotify` alubm directly to download so it won't missed any track.
- Fix `falsy` statement on `DAB`'s downloader when indexing a number `0`.

---

# ࿎「5.14.0」2025-10-23
## Added
- Adds ability to download Playlist, Album, and Single Track for `Spotifier`.

---

# ࿎「5.13.0」2025-10-22
## Added
- Finishing the `wait` message.

## Fix
- Heic converter for `Tiktok`.
- Prevent `Instagram` initialization every startup.

## Refactor
- Change reply behavior.

---

# ࿎「5.12.2」2025-10-21
## Added
- Shows `DAB`'s search responses if no index or id present.
- Adds ability to download from `DAB`'s search responses.
- Initialization for `wait` message using edit message rather than just stays waiting.
- Adds retry button if error occurred when using commands.

## Fixed
- Fix `dayjs` incorrectly renders timezone.
- Prevent `StubMessage` indexing property that could crash the app.

---

# ࿎「5.12.1」2025-10-19
## Performance
- Added caching to reduce repeated requests to `DAB` Downloader.

---

# ࿎「5.12.0」2025-10-18
## Added
- `DAB (Digital Audio Broadcasting)` Downloader, which are CD LOSSLESS type of audio you can stream and download.

## Chore
- Remove `heif-convert` package from installation script.

---

# ࿎「5.11.0」2025-09-27
## Fix
- Adds `imagemagick` convert method support for `.heic` files for `Tiktok`.

---

# ࿎「5.10.0」2025-09-26
## Added
- Send images sequence as `Template Carousel`.

---

# ࿎「5.9.0」2025-09-26
## Added
- New ability to get list of images profile's sequence. 

---

# ࿎「5.8.2」2025-09-26
## Fixed
- Prevent excessive tokenizer `YouTube.js` during startup.

---

# ࿎「5.8.1」2025-09-26
## Fixed
- Fix `SpotifyCard` server.

---

# ࿎「5.8.0」2025-09-25
## Performance
- Change `SpotifyCard` mesh background from node to server-side react app.

---

# ࿎「5.7.0」2025-09-24
## Added
- Adding `Gradients` property to `GithubGraph` as a background.

---

# ࿎「5.6.0」2025-09-24
## Performance
- Change `SpotifyCard` mesh background from headless to node.

---

# ࿎「5.5.1」2025-09-21
## Chore
- Make the `menu` readable.

---

# ࿎「5.5.0」2025-09-13
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

# ࿎「5.4.1」2025-08-27
## Fixed
- Pass correct variable to `updateProfilePicture` function.

## Chore
- Bump [`aki-api@7.0.1`](https://www.npmjs.com/package/aki-api/v/7.0.1)
- Disable Akinator game to prevent request error during `npm install`

---

# ࿎「5.4.0」2025-08-26
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

# ࿎「5.3.1」2025-08-25
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

# ࿎「5.3.0」2025-02-03
## Added
- `Bluesky`: Adding the ability to download bluesky posts.

---

# ࿎「5.2.2」2024-11-09
## Refactor
- `Tiktok, Instagram`: Moved functions to a different file.

---

# ࿎「5.2.1」2024-11-09
## Added
- `Tiktok, Instagram`: Adding Cache mechanism to the responses.

## Refactor
- Use optional chaining operator (`?.`) for safest guard clause rather than `in` keyword. 

---

# ࿎「5.2.0」2024-11-06
## Added
- `Tiktok`: Ability to download highest resolution of a video.
- Adding a few `wait message` before processing a downloader.

---

# ࿎「5.1.3」2024-11-05
## Fixed
- `Command(fetch)`: fix parser, and removing the quotation mark on the response string as it is not conventional.

## Chore
- Adding `CHANGELOG` Screenshot.

---

# ࿎「5.1.2」2024-11-04
## Refactor
- Cleanups unused variables.

---

# ࿎「5.1.1」2024-11-03
## Fixed
- `Facebook`: Scraping now using [`fdownloader.net`](https://fdownloader.net).
- Fix `loggers` on incoming messages event.
- Prevent reading `undefined` on Carousel.`getMessageType`.
- Kinda fixed the youtube downloader when client deployed on a server. Though it still have cloudflare on the end. Please use `youtubei.js`.

---

# ࿎「5.1.0」2024-11-02
## Added
- `Spinner` when loading the plugins. Use `--spin` flag before running the client.

## Refactor
- `printBanner` should printed before connecting.
- `console.clear` should fired on start, and not before/after serilization of connections and plugins.

---

# ࿎「5.0.9」2024-11-02
## Fixed
- `updateProfilePicture`, and improve cropping image using sharp.

---

# ࿎「5.0.8」2024-10-31
## Fixed
- Cache Users and Groups.
- Handle groups events and sync the cache.
- `Waiting for this message` hopefully be fixed with this fix.

---

# ࿎「5.0.7」2024-10-29
## Refactor
- Change function name to be more readable and make sense.

---

# ࿎「5.0.6」2024-10-25
## Fixed
- Fix module validator. Now using `yup`.

---

# ࿎「5.0.5」2024-10-24
## Fixed
- Fix `Carbon` border overweight on long codes. Now it's ACCURATE and symmetrically on both sides.

## Added
- New `Carbon` theme, `synthwave84`!

---

# ࿎「5.0.4」2024-10-23
## Fixed
- Fix `Carbon` padding not accurately represents real height.

---

# ࿎「5.0.3」2024-10-22
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

# ࿎「5.0.2」2024-10-21
## Fixed
- Fix `Instagram story`.

---

# ࿎「5.0.1」- 2024-10-21
## Fixed
- Fix `Instagram highlights`, and `post`.

---

# ࿎「5.0.0」- 2024-10-20
### Breaking Changes
- `Dropped Node.js version <18`: Many security risk on the older version, and may leaks performance.
- `Rewritten the prompt`: Change the `inquirer` prompt to `@inquirer/prompts` mainly because the legacy deps are not developed regularly.
- `Openai breaking changes on v4.`

## Added
- Logic to prevent `chokidar` from printing on the added files into the watch container.
- Introduced `AbortSignal.timeout` onto the prompt as it could take memory if you left them idle.
- Added `Spinners` into the plugins as a loading.
- Added more uploader [`catbox`](https://catbox.moe) and [`uguu`」(https://uguu.se).
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