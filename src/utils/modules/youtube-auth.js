import clip from 'clipboardy';
import { Innertube } from 'youtubei.js';
import { color, loggers, delay } from './index.js';

const bail = (...msg) => {
	loggers.error(...msg);
	throw new Error(msg);
};

const tube = await Innertube.create();

tube.session.once('auth-pending', ({ verification_url: verificationUrl, user_code: userCode }) => {
	loggers.info(color('URL  :', 'lilac'), color(verificationUrl, 'white'));
	loggers.info(color('Code :', 'lilac'), color(userCode, 'white'));
	loggers.warning(color('Open the link on your browser. Copy the code and paste it to the prompt.', 'lilac'));
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
		.then(() => loggers.info(color('YouTube Authentication cookie is copied to the clipboard!', 'lilac')))
		.catch(() => loggers.error(color('SSH detected.', 'red'), color('Could not copy the code.', 'gray')));

	await delay(200);

	loggers.info(color('Manually copy the cookie :', 'lilac'), color(code, 'white'));

	loggers.info(color('Paste them onto your environment [.env] file in YOUTUBE_AUTH key.', 'lilac'));
});

await tube.session.signIn();
