# Contributing

Thanks for considering a contribution. This document covers the
day-to-day dev loop and the PR checklist. For deeper context, start
at [doc/INDEX.md](./doc/INDEX.md).

## Dev loop

```sh
npm install               # one-time after cloning
npm run db:generate       # generate the Prisma client

# Iterate
npm run lint              # eslint, must pass with 0 errors
npm run typecheck         # tsc --noEmit, must pass with 0 errors
npm test                  # all tests, must pass

# Run the bot in watch mode (recommended for fast iteration)
node . <session_name> --watch --pair-mode --cool-down
```

`--watch` reloads changed command files without restarting the socket.
`--pair-mode` skips QR display and uses pairing codes instead.

## What CI checks

Every push and PR runs four jobs (`.github/workflows/ci.yml`):

1. **Lint** — `npm run lint`. Blocking.
2. **Typecheck** — `npm run typecheck`. Blocking. Validates files that
   opt in via `// @ts-check` (currently `manager`, `logger`, `router`,
   `context`, `command-loader`, `store`).
3. **Test** — `npm test`. Blocking. Includes the contract test that
   walks every command file under `src/commands/`.
4. **Audit** — `npm audit --omit=dev --audit-level=high`. Advisory
   (does not block). Will be promoted to blocking once the baseline is
   clean.

Locally, run all three in order before pushing. CI runs them in
parallel; expect ~2-4 minutes total.

## PR checklist

Tick these before requesting review:

- [ ] `npm run lint` passes (0 errors).
- [ ] `npm run typecheck` passes (0 errors).
- [ ] `npm test` passes locally.
- [ ] No new `console.log(error)` or `console.log(err)` in `src/`.
      Use `loggers.error('Context:', err)` instead — the logger
      auto-formats Error objects with `(file:line)` and a stack trail.
- [ ] No new bare `instance` reads. The bot's own jid is
      `client.user.id`. (`__botName` and `client` are still
      whitelisted in `eslint.config.js` for legacy paths but new code
      should not add to the count.)
- [ ] No new `__dirname` or `path.join(__dirname, ...)` references —
      ESM does not define `__dirname`. Use `'./relative/path'` or
      `new URL('./file', import.meta.url)`.
- [ ] If you added a command, the contract test
      (`__tests__/contract/commands.contract.test.js`) passes for it.
      It will fail your PR if the command does not match the schema
      or imports too slowly.
- [ ] If you added behaviour, you wrote a test. Use the fakes in
      `__tests__/_fixtures/` so the test runs without network/DB.
- [ ] If you touched docs, you also updated [doc/INDEX.md](./doc/INDEX.md)
      if the new content deserves a top-level link.

## Commit messages

See [COMMIT_RULE.md](./COMMIT_RULE.md). In short: imperative mood,
under 70 characters for the subject line, body explains why.

## Coding standards

The full list is in [AGENTS.md](./AGENTS.md). Highlights that show up
most often in review:

- **One responsibility per file.** Group by feature, not by type.
- **Avoid premature abstraction.** Duplicate twice before extracting.
- **Explicit over implicit.** Inject dependencies through parameters
  or context; do not rely on globals.
- **No silent failures.** Every catch must log, transform, or rethrow.
- **No comments unless they explain *why*.** If the code needs a
  comment to be understandable, restructure it.

## When something is bigger than a PR

If your change is large enough that it should be tracked as its own
work item, add a sub-section to
[next_release/codebase-improvements-plan.md](./next_release/codebase-improvements-plan.md)
under the relevant numbered step before opening the PR. That keeps
the plan accurate and the team aligned.

## Questions

Open an issue or check existing notes in `next_release/` — the team
uses that folder for design discussions and migration plans before
turning them into PRs.
