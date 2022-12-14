<div align='center'>
<img src='https://i.ibb.co/BBCqryH/Screenshot-from-2022-02-11-13-36-53.png' alt='s' width='500' />

# SimplebotPRO3

### Next-gen bot using Baileys-md, and latest version of simplebotPRO

---

</div>

# Table of Contents <a name='table'></a>

- [Installations](#installations)
  - [Linux](#linux)
  - [Windows](#windows)
- [Run](#run-the-project)
  - [Run With Flags](#available-flags)
- [Known Error Fixed](#common-occured-error)
  - [this.isZero() not a function](#zero)
  - [crash when added to a group](#crash)
- [Additional Context](#additional-context)

---

# Installations

## Linux

#### FFMPEG

```bash
sudo apt install ffmpeg
```

#### LIBWEBP

##### make sure to install `gcc`, and `make`

```bash
sudo apt-get install libjpeg-dev libpng-dev libtiff-dev libgif-dev
wget https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.2.4.tar.gz
tar xvzf libwebp-1.2.4.tar.gz
cd libwebp-1.2.4
./configure
make
sudo make install
```

<div align='center'>
<a href='#table'>go back</a>
</div>

## Windows

### FFMPEG

1. Download manual using this [link](https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip)
2. Extract it
3. Open the folder, go to bin, copy the path
4. Set/add the Environment path with the copied path

### LIBWEBP

1. Download manual using this [link](https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.2.3-windows-x64.zip)
2. Extract it
3. Open the folder, go to bin, copy the path
4. Set/add the Environment path with the copied path

<div align='center'>
<a href='#table'>go back</a>
</div>

# Run the project

`node . your_session_name --flag` you can find the available flags [here](#available-flags)

<div align='center'>
<a href='#table'>go back</a>
</div>

## Available Flags

| Flags             | Descriptions                                                                                        | Alias |
| ----------------- | --------------------------------------------------------------------------------------------------- | ----- |
| --prf your_prefix | Set your custom prefix. Don't use it if you want multi-prefixes                                     | -p    |
| --read_only       | Bot will ignore every incoming command and only read the chat with no logs                          | -y    |
| --auto_read       | Bot will enable auto-read chat                                                                      | -r    |
| --restrict        | Bot will ignore restricted command. Such Add, Promote, Demote                                       | -e    |
| --only_logs       | Only shows logs for incoming message and command. But will ignore message and command               | -o    |
| --no_logs         | This will disable the logs. But not ignore the incoming messages and command                        | -n    |
| --self_mode       | This mode will only listening to your own message and command                                       | -s    |
| --debug_mode      | Every incoming message will be extracted the metadata and showed to the logs                        | -g    |
| --multi_cmd       | You can use multiple command. Use \| to separate each command                                       | -m    |
| --auto_correct    | Automatically correcting every incoming command                                                     | -a    |
| --rainbow         | Make your console colorful                                                                          | -b    |
| --watch           | Watch files for changes and will auto remove previous cache. `WARNING : THIS CAN SLOWS YOUR SCRIPT` | -w    |
| --cool_down       | Enable cooldown for each commands                                                                   | -c    |
| --no_load         | Disable load animation                                                                              | -v    |
| --json            | Store WhatsApp data into JSON File                                                                  | -j    |
| --reset           | Reset WhatsApp session and start a new one                                                          | -k    |
| --story           | Fetch every incoming Story from your contacts                                                       | -q    |
| --offline         | Set your current client devices to offline                                                          | -f    |
| --no_call         | Do not disturb. Every incoming call will be rejected and the caller will be blocked                 | -d    |
| --help            | Will show this message in the console                                                               | -h    |

---

<div align='center'>
<a href='#table'>go back</a>
</div>

# Common Occured Error

### <a name="zero"></a> this.isZero() not a function

Go to `node_modules\long\src\long.js:474`

Add this code to line 474 (don't change the original 474 code. just add the code below) :

```js
if (typeof this.isZero != 'function') return '1';
```

### <a name="crash"></a> crash when added to a group

Please install the latest Baileys-md commit

# Additional Context

### Changing ID message :

Go to `node_modules\@adiwajshing\baileys\lib\Utils\generic.js:165`

Change the `BAE5` to anything. (do not includes special characters!)

<div align='center'>
<a href='#table'>go back</a>
</div>
