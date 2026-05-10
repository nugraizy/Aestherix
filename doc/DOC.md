# Documentations

## Table of Contents <a name='table'></a>
- [Additional Context](#additional-context)
- [Configuration](#configuration)
- [Flags](#available-flags)

---

<br></br>

# Additional Context

### Changing ID message :

Go to

```sh
node_modules\@adiwajshing\baileys\lib\Utils\generic.js:172
```

> **IMPORTANT** 
> Change the `BAE5` to anything. (`DO NOT` includes special characters!)

#### Or you can include `customId` to the socket config.

```javascript
const CONNECTION_CONFIG = {
	...YOUR_CONFIG,
	customId: 'HFINDER'
};
```

<div align='center'>
<a href='#table'>⬆️ Go Up</a>
</div>


## Configuration

Edit settings in `src/helper/config/settings.json`.

| Key | Default | One of Values |
| --- | --- | --- |
| logger_theme | dracula | 'dracula', 'synthwave', 'cyberpunk2077', 'catppuccin'. |

<div align='center'>
<a href='#table'>⬆️ Go Up</a>
</div>


## Available Flags

| Flag | Short | Description |
|---|---|---|
| `--prefix` | `-p` | Custom prefix(es), comma-separated for multiple |
| `--readOnly` | `-y` | Bot ignores all commands, reads chat only |
| `--autoRead` | `-r` | Auto read every incoming message |
| `--restrict` | `-e` | Ignore moderator commands (Add, Promote, Demote) |
| `--selfMode` | `-s` | Only owner and bot can use commands |
| `--debugMode` | `-g` | Show full message metadata in logs |
| `--multiCmd` | `-m` | Enable multi-cmd with `\|` separator |
| `--watch` | `-w` | Watch files and hot-reload on change |
| `--coolDown` | `-c` | Enable command cooldowns |
| `--ai` | `-i` | Handle messages with AI |
| `--limitReset` | `-l` | Auto-reset user limits |
| `--resetOnStart` | `-x` | Reset DB connections on start |
| `--noLimit` | `-u` | Disable command limits |
| `--pairMode` | `-z` | Pair number with code |
| `--pairNumber` | `-j` | Use specific number for pairing |
| `--story` | `-q` | Auto-download stories |
| `--offline` | `-f` | Set presence to offline |
| `--noCall` | `-d` | Reject incoming calls |
| `--printSelf` | `-v` | Print host's own messages in terminal |
| `--test` | | Test connection |
| `--help` | `-h` | Show help message |
| `--spin` | | Enable loading spinners |
| `--rainbow` | `-b` | Rainbow-colored logs |
| `--trace` | `-t` | Show errors |
| `--onlyLogs` | `-o` | Show logs only, ignore messages |
| `--noLogs` | `-n` | Suppress logs, still respond |


<div align='center'>
<a href='#table'>⬆️ Go Up</a>
</div>