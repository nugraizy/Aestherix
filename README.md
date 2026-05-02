<h2 align="center">
  <img src="src/media/logo.png" width="200" alt="Aestherix logo"/><br/>
  Aestherix
</h2>

<p align="center">
  Next-generation WhatsApp bot built with <a href="https://github.com/whiskeysockets/baileys">Baileys</a> &amp;
  JavaScript — all-in-one utilities, and easy to set up,<br> and <em>Blazingly Fast ⚡️ (sarcastically)</em>
</p>

<div align="center">

  <img src="https://img.shields.io/badge/version-6.11.0-blue?style=flat-square" alt="version"/>

  <a href="https://github.com/nugraizy/aestherix/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" title="MIT License">
    <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="license"/>
  </a>

  <a href="https://github.com/nugraizy/aestherix/stargazers/">
    <img title="Stars"  alt="Stars" src="https://img.shields.io/github/stars/nugraizy/aestherix?label=Stars&color=%23ffb7b2&style=flat-square">
  </a>
  <a href="https://github.com/nugraizy/aestherix/network/members">
    <img title="Forks" alt="Forks" src="https://img.shields.io/github/forks/nugraizy/aestherix?label=Forks&color=%23ffdac1&style=flat-square">
  </a>
  <a href="https://github.com/nugraizy/aestherix/watchers">
    <img title="Watching" alt="Watching" src="https://img.shields.io/github/watchers/nugraizy/aestherix?label=Watchers&color=%23e2f0cb&style=flat-square">
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
  - [Available flags](./doc/DOC.md#available-flags)
- [Changelog](./CHANGELOG.md)
- [Documentation](./doc/DOC.md#documentations)
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
npm install -f

# 3. Copy and fill in environment variables
cp .env.example .env   # then edit .env with your values
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

MongoDB does not support `migrate`. Use `db push` with the dedicated schema instead:

```sh
npm run db:generate:mongo
npm run db:push:mongo
```

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
See all available flags in [DOC.md](./doc/DOC.md#available-flags).

### Bot & Dashboard separately

```sh
# bot only
npm run start:bot

# dashboard only (default port: 4000, override with DASHBOARD_PORT)
npm run start:dashboard
```

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

## Contributors

<table align="center">
  <tr>
    <td align="center">
      <a href="https://github.com/nugraizy" target="_blank" rel="noopener noreferrer">
        <img src="https://github.com/nugraizy.png?size=96" width="80" height="80" alt="Nugraizy" style="border-radius:50%;"/><br/>
        <sub><b>Nugraizy</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/TobyG74" target="_blank" rel="noopener noreferrer">
        <img src="https://github.com/TobyG74.png?size=96" width="80" height="80" alt="TobyG74" style="border-radius:50%;"/><br/>
        <sub><b>Tobi Saputra</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/xbnfz01" target="_blank" rel="noopener noreferrer">
        <img src="https://github.com/xbnfz01.png?size=96" width="80" height="80" alt="xbnfz01" style="border-radius:50%;"/><br/>
        <sub><b>xbnfz01</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/Alphanum404" target="_blank" rel="noopener noreferrer">
        <img src="https://github.com/Alphanum404.png?size=96" width="80" height="80" alt="Alphanum404" style="border-radius:50%;"/><br/>
        <sub><b>Alphanum404</b></sub>
      </a>
    </td>
  </tr>
</table>

---

<p align="center">
  Made with ❤️ by the Hidden Finder Team
  <a href="./CHANGELOG.md">Changelog</a>
  <a href="./doc/DOC.md">Docs</a>
  <a href="https://github.com/nugraizy/aestherix/issues">Issues</a>
</p>
