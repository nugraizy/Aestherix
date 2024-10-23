# Changelog

All notable changes to this project will be documented in this file.

# [5.0.4] 2024-10-23
## Fixed
- Fix `carbon` padding not accurately represents real height.

---

# [5.0.3] 2024-10-22
## Fixed
- Fix **Instagram** utilities:
   - *searchUser*: fix user agent mismatch.
   - *hashtag*: fix source undefined.
   - *highlights*: fix timeout on fetchHighlight function. now using chunked data.

## Added
- Logic to prevent plugins relogger trying to relog a file that has no `proper/valid properties`.
- Logic to prevent plugins has the same `name` to other plugins.
- New ability to download **Instagram** `hashtag` results. Reply to the result & Use `<prefix>igpost [number<1-n>]`.

## Removed
- Removing `spinnies`.

---

# [5.0.2] 2024-10-21
## Fixed
- Fix **Instagram** `story`.

---

# [5.0.1] - 2024-10-21
## Fixed
- Fix **Instagram** `highlights`, and `post`.

---

# [5.0.0] - 2024-10-20
### Breaking Changes
- **Dropped Node.js version <18**: Many security risk on the older version, and may leaks performance.
- **Rewritten the prompt**: Change the `inquirer` prompt to `@inquirer/prompts` mainly because the legacy deps are not developed regularly.
- **Openai breaking changes on v4.**

## Added
- Logic to prevent `chokidar` from printing on the added files into the watch container.
- Introduced `AbortSignal.timeout` onto the prompt as it could take memory if you left them idle.
- Added `Spinners` into the plugins as a loading.
- Added more uploader [`catbox`](https://catbox.moe) and [`uguu`](https://uguu.se).
- Added script `instagram:login`. Add your `username`and `password` to .env, with `INSTAGRAM_USERNAME` and `INSTAGRAM_PASSWORD`, then run :
```sh
npm run instagram:login
```

## Removed
- Unused Fonts are being removed as it takes very big space.

## Fixed
- Fix `Instagram` login.
- Fix the `Nhentai` as per today they don't have CloudFlare enabled on their APIs.
- Fix 404 `Nhentai` with their image hosting domain.
- Fix the risk of memory leak cause by `@napi-rs/canvas`.
- Fix dead uploader ([`telegra.ph`](https://telegra.ph)), added more uploader as said above.
- Fix WritableStream on `imageToPdf` utility as it does not has event on `finish`
- Fix `eval` is not readable by bot causing it always print `boolean` on the body. Which is not as the behavior that was expected.
- Fix `SpotifyCard` is not properly render the text of the title and the song artists.