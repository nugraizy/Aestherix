import clip from 'clipboardy';
import { Innertube } from 'youtubei.js';
import { color, loggers, delay } from './index.js';

const bail = (...msg) => {
	loggers.ERR(...msg);
	throw new Error(msg);
};

const tube = await Innertube.create();

tube.session.once('auth-pending', ({ verification_url: verificationUrl, user_code: userCode }) => {
	loggers.INF(color('URL  :', '#E4C1F9'), color(verificationUrl, 'white'));
	loggers.INF(color('Code :', '#E4C1F9'), color(userCode, 'white'));
	loggers.WRN(color('Open the link on your browser. Copy the code and paste it to the prompt.', '#E4C1F9'));
});
tube.session.once('auth-error', (err) => bail(color('An error occurred :', 'red'), err));
tube.session.once('auth', async ({ credentials }) => {
	if (!credentials.access_token) {
		bail(color('Something went wrong.', 'red'));
	}

	const code = JSON.stringify(
		Object.entries(credentials)
			.map(([k, v]) => `${k}=${v instanceof Date ? v.toISOString() : v}`)
			.join('; ')
	);

	await delay(200);
	await clip
		.write(code)
		.then(() => {
			loggers.INF(color('YouTube Authentication cookie is copied to the clipboard!', '#E4C1F9'));
		})
		.catch(() => {
			loggers.ERR(color('SSH detected.', 'red'), color('Could not copy the code.', 'gray'));
		});

	await delay(200);

	loggers.INF(color('Manually copy the cookie :', '#E4C1F9'), color(code, 'white'));

	loggers.INF(color('Paste them onto your environment [.env] file in YOUTUBE_AUTH key.', '#E4C1F9'));
});

await tube.session.signIn();
