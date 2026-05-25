# Authoring Commands

Everything you need to ship a new command. If you have something working
in 30 minutes, this guide did its job.

## File layout

Commands live under `src/commands/<category>/<name>.js`. The category
folder controls the menu grouping and must match one of the values in
the schema (see below).

```
src/commands/
├── ai/
├── al-quran/
├── anime/
├── anonymous/
├── converter/
├── debugging/
├── downloader/
├── games/
├── helper/
├── look_up/
├── misc/
├── moderate/
├── news/
├── owner/
└── search/
```

Subfolders matching `subcommands/`, `ui/`, `__tests__/`, or any folder
starting with `_` are excluded from the loader.

## Minimal command

```js
import { defineCommand } from '../_define.js';

export default defineCommand({
    name: 'echo',
    minifiedDescription: 'Echo back',
    description: 'Repeat what you said.',
    usage: '!echo `<text>`',
    aliases: ['repeat'],
    category: 'Misc',
    cooldown: 3,
    limit: 0,
    status: 'enable',
    run: async (ctx, client) => {
        if (!ctx.query) {
            return ctx.reply('Give me something to echo.');
        }

        await ctx.reply(ctx.query);
    }
});
```

The loader auto-discovers it. No registration call needed.

## Schema (yup)

The CommandLoader validates every default export against
`COMMAND_SCHEMA` (exported from `src/core/command-loader.js`). The
contract test in `__tests__/contract/commands.contract.test.js` runs
the same validation for every file. Required fields:

| Field | Type | Notes |
|---|---|---|
| `name` | string | Lowercase. The bare command word users type. |
| `usage` | string | One-line usage hint shown in errors. Use backticks for placeholders. |
| `category` | enum | One of: `AI`, `AL-Quran`, `Anime`, `Anonymous`, `Converter`, `Debugging`, `Downloader`, `Games`, `Genshin Impact`, `Helper`, `Look-up`, `Misc`, `Moderation`, `News`, `Owner`, `Search`. |
| `cooldown` | int ≥ 0 | Per-user cooldown in seconds. |
| `limit` | int ≥ 0 | Per-day usage limit. `0` means unlimited. |
| `status` | `'enable'`\|`'disable'` | Disabled commands load but never run. |
| `run` | function | The handler. Receives `(ctx, client, store)`. |

Optional:

- `minifiedDescription` — short label shown in menus.
- `description` — longer help text.
- `aliases` — array of alternative names.
- `restrict` — only group admins can run it.
- `premium` — only premium users can run it.

## The `run` signature

```js
run: async (ctx, client, store) => { ... }
```

- **`ctx`** — a `Context` instance (`src/core/context.js`). Lazy
  getters for `from`, `sender`, `body`, `args`, `query`, `cmd`,
  `prefix`, `isGroup`, `isOwner`, `mention`, `message`, etc. Plus
  convenience methods `reply(text)`, `react(emoji)`, `send(content,
  options)`, `sendTo(jid, content, options)`, `delete()`.
- **`client`** — the active `ClientSocket`. Use this for anything
  that needs the underlying WhatsApp socket: `client.send(...)`,
  `client.relay(...)`, `client.TemplateBuilder.Native`,
  `client.downloadMediaMessage(...)`, etc.
- **`store`** — the message store. Most commands ignore it; needed
  if you reference quoted messages by id.

## Testing a command

Use the shared fakes in `__tests__/_fixtures/`:

```js
import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';

import echo from '../../src/commands/misc/echo.js';
import { makeFakeClient, makeFakeContext } from '../_fixtures/index.js';

describe('echo', () => {
    let client;

    beforeEach(() => {
        client = makeFakeClient();
    });

    it('replies with the query', async () => {
        const ctx = makeFakeContext({ args: ['echo', 'hello', 'world'] });

        await echo.run(ctx, client);

        assert.equal(ctx.replies.length, 1);
        assert.equal(ctx.replies[0].text, 'hello world');
    });

    it('rejects when no text is given', async () => {
        const ctx = makeFakeContext({ args: ['echo'] });

        await echo.run(ctx, client);

        assert.match(ctx.replies[0].text, /something to echo/);
    });
});
```

The fakes record every send/reply/reaction so you can assert without a
mocking library. They are intentionally permissive — methods return
resolved promises so `await` works, but they do not validate inputs.

## Common pitfalls

### `__dirname` is undefined in ESM

The project is `"type": "module"`. `__dirname` and `require` do not
exist. Use one of:

```js
// Cwd-relative (matches the rest of the codebase):
const data = await fs.readJSON('./databases/foo/bar.json');

// File-relative URL (when the data sits next to the source file):
const data = await fs.readJSON(new URL('./bar.json', import.meta.url));
```

The contract test catches these at import time. Runtime references
slip through, so audit any `path.join(__dirname, ...)` in command
files before committing.

### Top-level imports trigger boot cost

If your command imports a heavy library (`puppeteer`, `tesseract.js`,
`enka-network-api`), every other command file pays the boot cost
when the loader walks the tree. Move heavy work behind a lazy
`await import('heavy-lib')` inside `run`.

The contract test budgets each import at 5 seconds; exceed it and you
will see `took XXXXms to import (budget 5000ms)`.

### Errors and logging

Never `console.log(error)` in a catch — use the logger:

```js
import { color, loggers } from '../../utils/modules/index.js';

try {
    /* ... */
} catch (error) {
    loggers.error(color('My command failed:', 'red'), error);
}
```

Error objects are auto-formatted by the logger as
`<message> (file:line)` plus a trimmed stack on the next line. No need
to extract the location yourself.

### Globals are restricted

`instance` (the bot's own jid) was migrated to `client.user.id`. Do
not introduce new bare global reads. The eslint config still allows
`__botName` (60+ bare references migrated separately) and `client` in
some legacy paths, but new code should accept `client` as a parameter.

### Run signature varies

Some older commands destructure context fields and only take `client`:

```js
run: async ({ from, sender, args }, client) => { ... }
```

Both forms work. Prefer the `(ctx, client)` form for new commands so
you can use the convenience methods (`ctx.reply`, `ctx.react`).

If your command also needs the message store, accept it as the third
arg: `run: async (ctx, client, store) => { ... }`. Forgetting `store`
when you reference it (e.g. for recursive `Context.from(...)` calls)
is a real bug — see `src/commands/converter/sticker-to-media.js` for
the correct shape.

## Verification before commit

```sh
npm run lint        # 0 errors required
npm run typecheck   # 0 errors required (only opt-in files validated)
npm test            # all tests must pass; the contract test will run
                    # on every command file
```

The contract test is your safety net — it imports every command file,
validates the schema, and budgets import time. If your file fails the
contract test, every CI run will fail until you fix it.
