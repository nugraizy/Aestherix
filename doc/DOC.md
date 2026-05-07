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

| Flags | Descriptions | Alias |
| --- | --- | --- |
| --prf your_prefix | Set your custom `prefix`. Don't use it if you want `multi-prefixes`. | -p |
| --readOnly | Bot will ignore every incoming command and only read the chat with no logs. | -y |
| --autoRead | Bot will enable `auto-read` chat. | -r |
| --restrict | Bot will ignore restricted command. Such Add, Promote, and Demote. | -e |
| --onlyLogs | Only shows logs for incoming message and command. But will ignore message and command. | -o |
| --noLogs | This will disable the logs. But not ignore the incoming messages and command. | -n |
| --selfMode | This mode will only listening to your own message and command. | -s |
| --debugMode | Every incoming message will be extracted the metadata and showed to the logs. | -g |
| --multiCmd | You can use multiple command. Use `\|` to separate each command. | -m |
| --autoCorrect | Automatically correcting every incoming command. | -a |
| --rainbow | Make your console colorful. | -b |
| --watch | Watch files for changes and will auto remove previous cache. | -w |
| --coolDown | Enable cooldown for each commands. | -c |
| --story | Fetch every incoming Story from your contacts. | -q |
| --offline | Set your current client devices to offline. | -f |
| --noCall | Do not disturb. Every incoming call will be rejected and the caller will be blocked. | -d |
| --instaNotifier | Handle incoming Instagram DMs. | -i |
| --limitReset | Enable Auto-reset user's limit. | -l |
| --resetOnStart | Auto reset DB-Connections every start of the script. | -x |
| --noLimit | Set commands limit to None. | -u |
| --pairMode | Pair your number with code. | -z |
| --help | Will show this message in the console. | -h |


<div align='center'>
<a href='#table'>⬆️ Go Up</a>
</div>