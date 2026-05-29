<h2 align="center">
  <img src="src/media/logo.png" width="200" alt="Aestherix logo"/><br/>
  Aestherix
</h2>

<p align="center">
  Next-generation WhatsApp bot built with <a href="https://github.com/whiskeysockets/baileys">Baileys</a> &amp;
  JavaScript — all-in-one utilities, and easy to set up,<br> and <em>Blazingly Fast ⚡️ (sarcastically)</em>
</p>

<div align="center">

  <img src="https://img.shields.io/badge/version-7.10.0-purple?style=flat-square" alt="version"/>

  <a href="https://github.com/nugraizy/aestherix/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" title="MIT License">
    <img src="https://img.shields.io/badge/license-MIT-red?style=flat-square" alt="license"/>
  </a>

  <a href="https://github.com/nugraizy/aestherix/stargazers/">
    <img title="Stars"  alt="Stars" src="https://img.shields.io/github/stars/nugraizy/aestherix?label=Stars&color=gold&style=flat-square">
  </a>
  <a href="https://github.com/nugraizy/aestherix/network/members">
    <img title="Forks" alt="Forks" src="https://img.shields.io/github/forks/nugraizy/aestherix?label=Forks&color=silver&style=flat-square">
  </a>
  <a href="https://github.com/nugraizy/aestherix/watchers">
    <img title="Watching" alt="Watching" src="https://img.shields.io/github/watchers/nugraizy/aestherix?label=Watchers&color=green&style=flat-square">
  </a>

  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square" alt="node"/>
  <img src="https://img.shields.io/badge/platform-WhatsApp-25D366?style=flat-square&logo=whatsapp&logoColor=white" alt="platform"/>
</div>


## Table of Contents <a name="table"></a>

- [Pronunciation & Philosophy](#pronunciation--philosophy)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Running the Project](#running-the-project)
  - [All-in-one](#all-in-one)
  - [Bot & Dashboard separately](#bot--dashboard-separately)
  - [PM2 split runtime](#pm2-split-runtime)
  - [Available flags](./doc/OPERATIONS.md#cli-flags)
- [Dashboard](#dashboard)
- [Development](#development)
- [Changelog](./CHANGELOG.md)
- [Documentation index](./doc/INDEX.md)
- [Contributing](./CONTRIBUTING.md)
- [Agent Guide](./AGENTS.md)
- [Contributors](#contributors)

---

## Pronunciation & Philosophy

**Aestherix** — pronounced [`/ɛsˈθɛrɪks/`](src/media/pronounciation.m4a?raw=true):
`ES` (l**ess**, str**ess**) · `THEH` (e**ther**) · `RIKS` (t**ricks**, b**ricks**)

| Part | Meaning |
|------|---------|
| **Aesthet-** | From *Aesthetics* — appreciation of beauty and form |
| **-ether-** | Evoking the ethereal and intangible |
| **-ix** | Suffix associated with innovation, technology, and complexity |

---

## Installation

Full platform-specific guides live in **[doc/INSTALL.md](./doc/INSTALL.md)**.

Quick summary:

```sh
# 1. Clone the repo
git clone https://github.com/nugraizy/aestherix.git
cd aestherix

# 2. Install dependencies
npm install

# 3. Copy and fill in environment variables
cp example.env .env   # then edit .env with your values
```

> **Linux/macOS** users: run `chmod +x ./doc/install/install.sh && ./doc/install/install.sh` to install all native deps automatically.
>
> **Windows** users: run `.\doc\install\install.ps1` (as Administrator) to install build tools, FFMPEG, and libwebp.

---

## Database Setup

Aestherix uses **Prisma** and supports four database providers.
Set these two variables in your `.env` file:

```sh
# choose one of the following: postgresql | mysql | sqlite | mongodb
DATABASE_PROVIDER="postgresql"

# connection string for your chosen provider
DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

### Provider examples

| Provider | `DATABASE_PROVIDER` | `DATABASE_URL` example |
|----------|---------------------|------------------------|
| PostgreSQL / Supabase / Neon | `postgresql` | `postgresql://user:pass@host:5432/db` |
| MySQL / MariaDB | `mysql` | `mysql://user:pass@host:3306/db` |
| SQLite (local dev) | `sqlite` | `file:./databases/local.db` |
| MongoDB Atlas | `mongodb` | `mongodb+srv://user:pass@cluster.mongodb.net/db` |

### Apply the schema

**PostgreSQL / MySQL / SQLite:**

```sh
# generate the Prisma client
npm run db:generate

# push the schema to your database (no migration history)
npm run db:push

# or create a proper migration (recommended for production)
npm run db:migrate
```

**MongoDB:**

`prisma.config.js` reads `DATABASE_PROVIDER` and switches to
`prisma/schema.mongodb.prisma` automatically when it equals
`mongodb`, so the regular scripts already do the right thing:

```sh
npm run db:generate
npm run db:push
```

`prisma migrate` is **not** supported on MongoDB — always use `db push`.
The `npm run db:generate:mongo` / `db:push:mongo` scripts remain as
explicit overrides if you want to force the Mongo schema regardless of
`DATABASE_PROVIDER`.

### Other database scripts

| Script | Description |
|--------|-------------|
| `npm run db:migrate:deploy` | Apply pending migrations in production |
| `npm run db:reset` | Drop and re-create all tables |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |

---

## Running the Project

### All-in-one

```sh
node . <session_name> [--flag]
```

Replace `<session_name>` with your WhatsApp session name (e.g. `mybot`).
See all available flags in [doc/OPERATIONS.md](./doc/OPERATIONS.md#cli-flags).

### Bot & Dashboard separately

```sh
# bot only
npm run start:bot

# dashboard only (default port: 4000, override with DASHBOARD_PORT)
npm run start:dashboard
```

### Building the dashboard frontend

The dashboard frontend lives in `dashboard/client/` (Svelte 5 + Vite).
Install its dependencies and build the production bundle:

```sh
# one-time, after cloning the repo
npm run dashboard:install

# rebuild after editing dashboard/client/**
npm run dashboard:build

# Vite dev server with HMR (proxies /api and /socket.io to the bot)
npm run dashboard:dev
```

The build output (`dashboard/client/dist/`) is served by the dashboard
server at `/dashboard`. `npm run build` is an alias of
`npm run dashboard:build`.

### PM2 split runtime

```sh
# start both as separate PM2 apps
npm run pm2:split

# tail logs for both apps
npm run pm2:split:logs

# stop both apps
npm run pm2:split:stop
```

<div>
  <h2>🌐 Live Dashboard Demo</h2>
  <a href="https://aestherix.dev/">
    <img title="Live-Demo" alt="Live-Demo" src="https://img.shields.io/badge/Visit-aestherix.dev-blue?style=for-the-badge">
  </a>
</div>

---

## Dashboard

The embedded dashboard (default `http://localhost:4000`, override with `DASHBOARD_PORT`) gives you live control over the bot:

- Toggle boolean CLI flags and individual commands at runtime.
- Configure prefix mode (single, multi, or no-prefix) with custom prefix characters — persisted to `settings.json`.
- Live status, logs, and audit panels via Socket.IO.
- Owner-authenticated actions via OTP; admin sessions via cookies.

Full REST endpoints, Socket.IO rooms, and internals are documented in [AGENTS.md](./AGENTS.md#dashboard). User-facing configuration lives in [doc/DOC.md](./doc/DOC.md#dashboard).

---

## Development

```sh
# lint the whole project
npm run lint

# lint a specific file
npm run lint:file src/commands/misc/ping.js
```

`nodemon` is available via `npm run dev`, but the recommended dev loop uses the built-in `--watch` flag which hot-reloads changed command files without restarting the socket connection:

```sh
node . <session_name> --watch --pair-mode --cool-down
```

See [AGENTS.md](./AGENTS.md) for architecture, event flow, command shape, and code standards.

---

## Contributors
<p align="center">
  <a href="https://github.com/nugraizy/aestherix/graphs/contributors" >
    <img src="https://contrib.rocks/image?repo=nugraizy/aestherix" />
  </a>
</p>

---

<p align="center">
  Made with 💜 by the Hidden Finder Team<br>
  <a href="./CHANGELOG.md">Changelog</a>
   •
  <a href="./doc/INDEX.md">Docs</a>
   •
  <a href="https://github.com/nugraizy/aestherix/wiki">Wiki</a>
   •
  <a href="https://github.com/nugraizy/aestherix/issues">Issues</a>
</p>
