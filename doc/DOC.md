# Documentations

## Table of Contents <a name='table'></a>
- [Additional Context](#additional-context)
- [Instagram method](#instagram-methods)
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


# Instagram Methods
#### before started you must do a login method
```javascript
const login = async () => {
  const instagram = new InstagramApi('username', 'password');

  const login = await instagram.account.login();

  login.account.writeLoginInfo();
}

 await login()
 ```
 
<div align='center'>
<a href='#table'>⬆️ Go Up</a>
</div>


## Available Flags

| Flags | Descriptions | Alias |
| --- | --- | --- |
| --prf your_prefix | Set your custom prefix. Don't use it if you want multi-prefixes. | -p |
| --read_only | Bot will ignore every incoming command and only read the chat with no logs. | -y |
| --auto_read | Bot will enable auto-read chat. | -r |
| --restrict | Bot will ignore restricted command. Such Add, Promote, Demote. | -e |
| --only_logs | Only shows logs for incoming message and command. But will ignore message and command. | -o |
| --no_logs | This will disable the logs. But not ignore the incoming messages and command. | -n |
| --self_mode | This mode will only listening to your own message and command. | -s |
| --debug_mode | Every incoming message will be extracted the metadata and showed to the logs. | -g |
| --multi_cmd | You can use multiple command. Use \| to separate each command. | -m |
| --auto_correct | Automatically correcting every incoming command. | -a |
| --rainbow | Make your console colorful. | -b |
| --watch | Watch files for changes and will auto remove previous cache. `WARNING : THIS CAN SLOWS YOUR SCRIPT` | -w |
| --cool_down | Enable cooldown for each commands. | -c |
| --no_load | Disable load animation. | -v |
| --json | Store WhatsApp data into JSON File. | -j |
| --reset | Reset WhatsApp session and start a new one. | -k |
| --story | Fetch every incoming Story from your contacts. | -q |
| --offline | Set your current client devices to offline. | -f |
| --no_call | Do not disturb. Every incoming call will be rejected and the caller will be blocked. | -d |
| --insta_notifier | Handle incoming Instagram DMs. | -i |
| --limit_reset | Enable Auto-reset user's limit. | -l |
| --reset_on_start | Auto reset DB-Connections every start of the script. | -x |
| --no_limit | Set commands limit to None. | -u |
| --pair_mode | Pair your number with code. | -z |
| --help | Will show this message in the console. | -h |


<div align='center'>
<a href='#table'>⬆️ Go Up</a>
</div>