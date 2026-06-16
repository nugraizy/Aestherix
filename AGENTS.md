# Aestherix Agent Guide

- Follow existing patterns; prefer small, localized changes.
- Use `defineCommand()` for commands (no per-file CommandProps imports).
- Keep doc updates in sync with code changes.
- Prefer `rtk`-prefixed commands when using the terminal.
- For codebase architecture, see [doc/DOC.md](doc/DOC.md).
- For coding standards, see `~/.claude/CLAUDE.md`.

## Code Standards

### Think Before Coding
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them.
- Push back when a simpler approach exists.

### Simplicity First
- Minimum code that solves the problem. Nothing speculative.
- No features beyond what was asked.
- No abstractions for single-use code.
- If 200 lines could be 50, rewrite it.

### Surgical Changes
- Touch only what you must.
- Don't "improve" adjacent code, comments, or formatting.
- Match existing style, even if you'd do it differently.
- Remove only imports/variables/functions YOUR changes made unused.

### Naming
- Variable names describe intent, not implementation.
- Avoid abbreviations unless universally understood.
- Booleans read naturally: `isEnabled`, `hasPermission`, `canRetry`.

### Function Design
- Functions do one thing only.
- Avoid hidden side effects.
- Prefer pure functions when possible.
- Use early returns to avoid deep nesting.

### Error Handling
- Never silently ignore errors.
- Prefer async/await over callbacks.
- Always handle promise rejections.

### Comments
- Comments explain *why*, not *what*.
- Do NOT add comments unless they clarify intent that cannot be expressed through code.
- Prefer extracting logic into well-named functions instead of commenting.
- Exceptions: legal/license, unavoidable edge cases, complex algorithms.

### Code Validation
- Verify every variable, function, class, import is defined before usage.
- Never reference undeclared variables.
- Ensure refactors don't leave orphaned references.

### Architecture
- One file, one responsibility.
- Group files by feature, not by file type.
- Duplicate twice before abstracting.
- Composition over inheritance.
- Shared behavior lives in reusable utilities.

### Forbidden
- Magic numbers without explanation
- Silent failures
- Deep inheritance chains
- Hidden mutations
- Overengineered patterns
- Clever unreadable one-liners
- Global mutable state

## Commands

```sh
npm run db:generate        # prisma generate (SQL)
npm run db:push            # prisma db push (SQL)
npm run db:migrate         # prisma migrate dev (SQL)
npm run db:reset           # prisma migrate reset (SQL)
npm run db:studio          # prisma studio (visual DB browser)
npm run db:generate:mongo  # prisma generate --schema=prisma/schema.mongodb.prisma
npm run db:push:mongo      # prisma db push --schema=prisma/schema.mongodb.prisma
```

## Running

- All-in-one: `node . <session_name> [--flags]`
- Bot only: `npm run start:bot`
- Dashboard only: `npm run start:dashboard`
- PM2 split: `npm run pm2:split`

## Session

- Session name from CLI arg or `settings.json.main_session` (default: `aestherix-bot`)
- Default session name in `src/core/cli.js` (`DEFAULT_SESSION`)

## Important Files

| File | Purpose |
|---|---|
| `src/core/configuration.js` | `Configuration` singleton — all runtime state (registry, flags, prefix, groups, users, games, timers) |
| `src/helper/config/connect.js` | Re-exports `Configuration` singleton. Primary import path |
| `src/core/cli.js` | `Cli` class (meow wrapper), exports flags/session |
| `src/helper/config/settings.json` | Bot config (prefix, owner, limits). Write via `fs.writeJSON` to persist |
| `src/core/boot.js` | Boot orchestrator — wires Auth, ClientSocket, CommandLoader, Router, EventHandler, dashboard, sub-bots |
| `src/core/client-socket.js` | `ClientSocket` (extends EventEmitter), wraps Baileys `makeWASocket`, send/media/template methods |
| `src/core/event-handler.js` | `EventHandler` — central Baileys event dispatcher (messages, connection, groups, presence, calls) |
| `src/core/message-handler.js` | `MessageHandler` — dispatch loop, multi-cmd (`&&`), piping, guards, auto-correct, retry |
| `src/core/context.js` | `Context`, per-message lazy getters + convenience methods |
| `src/core/router.js` | `Router`, command lookup + cooldown + sub-bot blocking + usage persistence |
| `src/core/command-loader.js` | `CommandLoader` — discovers, validates (Yup), hot-reloads commands from `src/commands/` |
| `src/core/pipeline.js` | `PipelineExecutor` — command piping with `\|` operator |
| `src/core/manager.js` | `Manager`, multi-instance orchestration (primary + sub-bots) |
| `src/commands/_define.js` | `defineCommand()` factory — every command file imports this |
| `src/helper/database/prisma.js` | Prisma client singleton, used by Auth, Store, and all DB adapters |
| `src/helper/groups/settings/group-default-settings.js` | `updateSettings()` — per-group settings in DB via Prisma |

## CLI Flags

Parsed via `meow` in `src/core/cli.js`. Key flags: `--prefix/-p`, `--self-mode/-s`, `--multi-cmd/-m`, `--watch/-w`, `--ai`, `--pipe`, `--debug-mode`, `--no-logs`, `--profile`.
