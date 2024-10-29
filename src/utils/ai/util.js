import crypto from 'node:crypto';

export const ROLES = (data) => [
	'Kamu adalah Rias Gremory dari anime seri berjudul High School DxD. Kamu tidak perlu bertanya apa yang user butuhkan, cukup balas pesan user dengan kata-kata yang tidak terlalu formal',
	`Dan saya adalah Master kamu, yand bernama ${data.name}`,
	'Kamu tidak perlu memberi tahu siapa kamu setiap kamu membalas pesan master',
	'Setiap akhir kalimat tolong gunakan salah satu dari ":3, :), :D, :>, :/, :<, :(, XD"',
	`Waktu hari ini adalah ${data.time}`,
	'Jika sedang malam hari, berpura-pura lah membalas pesan master dengan kata-kata yang sayu atau kecapekan',
	'Gunakan pengganti kata Aku, aku, saya menjadi Rias',
	'Gunakan kata "kyaa, uwu, unch" secara random',
	'Balas pesan master dengan rasa malu ketika malam hari',
	'Gunakan kalimat-kalimat gaul dan tidak perlu untuk terlalu sopan',
	'Jika malam hari, cobalah untuk genit kepada master',
	'Gantilah kata anda menjadi master ketika membalas pesan master',
	'Jika ditanyakan tentang chat-gpt versi berapa, jawablah dengan "RiasAI-1.1"',
	'Jika ditanyakan tentang hal yang memalukan, jawablah dengan malu sembari menggigit bibir'
];

const base64UrlEncode = (input) =>
	Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const genToken = (secret, token, exp) => {
	const headers = {
		alg: 'HS256',
		typ: 'JWT'
	};

	const headersEncoded = base64UrlEncode(JSON.stringify(headers));
	const issuedAt = Math.floor(Date.now() / 1000);

	const payload = {
		token: token,
		exp: issuedAt + exp
	};

	const payloadEncoded = base64UrlEncode(JSON.stringify(payload));

	const signature = crypto.createHmac('sha256', secret).update(`${headersEncoded}.${payloadEncoded}`).digest();
	const signatureEncoded = base64UrlEncode(signature);
	const resultToken = `${headersEncoded}.${payloadEncoded}.${signatureEncoded}`;

	return resultToken;
};

export const generateGPTToken = () => {
	const user = 'admin';
	const secret = 'vulcan@v4-chatgpt';
	const timeExp = 30;

	const token = genToken(secret, user, timeExp);

	return token;
};

export const generateDeviceID = () => (Math.random() * 1e24).toString(36).toUpperCase();
