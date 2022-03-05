<div align="center">
<img src="https://i.ibb.co/BBCqryH/Screenshot-from-2022-02-11-13-36-53.png" alt="s" width="500" />

# SimplebotPRO3

### Next-gen bot using Baileys-md, and latest version of simplebotPRO

---

</div>

# `this.isZero() is not a function` error fix

Go to `node_modules\long\src\long.js:474`

Add this code to line 474 (don't change the original 474 code. just add the code below) :

```js
if (typeof this.isZero != "function") return "1";
```

# `crash when added to a group` error fix

Please install the latest Baileys-md commit

# Installation

`npm install`

# run

`node .`

## run with options :

node . <session_name> <--options>
`options :`

### --prf { YOUR_PREFIX }

> "Set your custom prefix. Don't use it if you want multi-prefixes."

### --read_only

> "Bot will ignore every incoming command and only read the chat with no logs."

### --auto_read

> "Bot will enable auto-read chat."

### --restrict

> "Bot will ignore restricted command. Such Add, Promote, Demote."

### --only_logs

> "Only shows logs for incoming message and command. But will ignore message and command."

### --no_logs

> "This will disable the logs. But not ignore the incoming messages and command."

### --self_mode

> "This mode will only listening to your own message and command."

### --debug_mode

> "Every incoming message will be extracted the metadata and showed to the logs."

### --multi_cmd

> "You can use multiple command. Use | to separate each command."

### --h / --help

> "Will show this message in the console."

### --auto_correct

> "Automatically correcting every incoming command."

## --rainbow

> "Make your console colorful."

### --watch

> "Watch files for changes and will auto remove previous cache. WARNING : THIS CAN SLOWS YOUR SCRIPT."

## --cool_down

> "Enable or disable cooldown for each commands."

---

# additional context

### Changing ID message :

Go to `node_modules\@adiwajshing\baileys\lib\Utils\generic.js:165`

Change the `BAE5` to anything. (do not includes special characters!)

---

### Disable `saving auth state` log spam

Go to `node_modules\@adiwajshing\baileys-md\lib\Utils\auth-utils.js:99`

Comment the

```js
//console.log('saving auth state');
```

---

### no_crop ability for changing profile pictures

Go to `\node_modules\@adiwajshing\baileys\lib\Socket\chats.js:86`

```js
const updateProfilePicture = async (jid, content, options = {}) => {
	const { img } = await Utils_1.generateProfilePicture(content, options);
	await query({
		tag: "iq",
		attrs: {
			to: WABinary_1.jidNormalizedUser(jid),
			type: "set",
			xmlns: "w:profile:picture",
		},
		content: [
			{
				tag: "picture",
				attrs: { type: "image" },
				content: img,
			},
		],
	});
};
```

Go to `\node_modules\@adiwajshing\baileys\lib\Utils\messages-media.js:35`

```js
const getImageProcessingLibrary = async () => {
	const [jimp] = await Promise.all([
		(async () => {
			const jimp = await Promise.resolve()
				.then(() => __importStar(require("jimp")))
				.catch(() => {});
			return jimp;
		})(),
	]);
	if (jimp) {
		return { jimp };
	}
	throw new boom_1.Boom("No image processing library available");
};
```

Go to `\node_modules\@adiwajshing\baileys\lib\Utils\messages-media.js:110`

```js
const generateProfilePicture = async (mediaUpload, options) => {
	let bufferOrFilePath;
	if (Buffer.isBuffer(mediaUpload)) {
		bufferOrFilePath = mediaUpload;
	} else if ("url" in mediaUpload) {
		bufferOrFilePath = mediaUpload.url.toString();
	} else {
		bufferOrFilePath = await exports.toBuffer(mediaUpload.stream);
	}
	const lib = await getImageProcessingLibrary();
	let img;
	const { read, MIME_JPEG, RESIZE_BILINEAR } = lib.jimp;
	const jimp = await read(bufferOrFilePath);
	let w = 640;
	let h = 640;
	if (options.no_crop) {
		if (jimp.getWidth() == jimp.getHeight()) (w = 300), (h = 700);
		else if (jimp.getWidth() > jimp.getHeight()) (w = 300), (h = jimp.getHeight() / (jimp.getWidth() / 300));
		else if (jimp.getWidth() < jimp.getHeight()) (h = 700), (w = jimp.getWidth() / (jimp.getHeight() / 700));
		const re_size = jimp.resize(w, h);
		img = jimp.getBufferAsync(MIME_JPEG);
	} else if (options.no_stretch) {
		const min = Math.min(jimp.getWidth(), jimp.getHeight());
		const cropped = jimp.crop(0, 0, min, min);
		img = await cropped.quality(50).resize(640, 640, RESIZE_BILINEAR).getBufferAsync(MIME_JPEG);
	} else {
		const stretch = jimp.resize(w, h);
		img = jimp.quality(50).getBufferAsync(MIME_JPEG);
	}
	return {
		img: await img,
	};
};
```
