# Changelog

All notable changes to this project will be documented in this file.

## [5.0.0] - 2024-10-20
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