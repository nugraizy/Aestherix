# Aestherix Agent Guide

## Table of Contents
- [AI Instructions](#ai-instructions)
- [RTK Commands](#rtk-commands)
- [Code Standards](#code-standards)

## AI Instructions

This file is for agent behavior and coding conventions. For codebase flows, architecture, and system overview, see [doc/DOC.md](doc/DOC.md).

- Follow existing patterns; prefer small, localized changes.
- Use `defineCommand()` for commands (no per-file CommandProps imports).
- Keep doc updates in sync with code changes.
- Prefer `rtk`-prefixed commands when using the terminal.

## RTK Commands
<!-- rtk-instructions v2 -->
### RTK (Rust Token Killer) - Token-Optimized Commands

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

Flag parsing via `meow` in `src/core/cli.js`. Flags added there are available in `configuration.flags`.

| Flag | Short | Description |
|---|---|---|
| `--prefix` | `-p` | Set custom prefix(es), comma-separated |
| `--read-only` | | Read only |
| `--auto-read` | | Auto read every incoming message |
| `--restrict` | | Restrict moderator commands |
| `--only-logs` | | Only show logs, ignore messages and commands |
| `--no-logs` | | Suppress logs while still responding to commands |
| `--self-mode` | `-s` | Only owner and the bot can use commands |
| `--debug-mode` | | Show full message metadata |
| `--multi-cmd` | `-m` | Enable multi-cmd with `&&` separator |
| `--watch` | `-w` | Watch files and reload on change |
| `--cool-down` | `-c` | Enable command cooldowns |
| `--auto-correct` | | Auto-correct command names |
| `--story` | | Auto-download stories |
| `--offline` | | Set presence to offline |
| `--no-call` | | Reject incoming calls |
| `--ai` | | Handle incoming messages with AI |
| `--limit-reset` | `-l` | Auto-reset user limits |
| `--reset-on-start` | | Reset DB connections on start |
| `--no-limit` | | Disable command limits |
| `--pair-mode` | | Enable pair mode |
| `--pair-number` | | Use a specific number for pairing |
| `--test` | | Test connection |
| `--print-self` | | Print host messages in terminal |
| `--pipe` | | Enable command piping with `\|` operator |
| `--profile` | | Log per-message dispatch latency (PROFILE level) |
| `--help` | `-h` | Show help message |
| `--rainbow` | `-b` | Rainbow-colored logs |
| `--trace` | | Show errors |

---

## Session
- Session name resolved from CLI arg or `settings.json.main_session` (default: `aestherix-bot`)
- Default session name derived in `src/core/cli.js` (`DEFAULT_SESSION`) via sync `fs.readJSONSync`

---

## Running
- All-in-one: `node . <session_name> [--flags]`
- Bot only: `npm run start:bot`
- Dashboard only: `npm run start:dashboard`
- PM2 split: `npm run pm2:split`

---

## Important Files
- `src/helper/config/connect.js` — global config singleton, reads `settings.json`, holds `configuration.OPTIONS`, `configuration.cache`
- `src/core/cli.js` — `Cli` class (meow wrapper), exports parsed flags and session name
- `src/helper/config/settings.json` — bot config (prefix, owner, limits, etc.). Write via `fs.writeJSON` to persist
- `src/core/boot.js` — boot orchestrator, wires all core classes
- `src/core/client-socket.js` — `ClientSocket` class, owns all send/media/template methods
- `src/core/context.js` — `Context` class, per-message lazy getters + convenience methods
- `src/core/router.js` — `Router` class, command lookup + cooldown + sub-bot blocking
- `src/core/manager.js` — `Manager` class, multi-instance orchestration
- `src/helper/groups/settings/group-default-settings.js` — `updateSettings()` updates group settings in DB, not settings.json

---

## Code Standards

# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

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
