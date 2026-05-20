import { fileTypeFromBuffer } from 'file-type';
import fs from 'fs-extra';
import { fetch } from 'undici';
import yargsParser from 'yargs-parser';

import { extension, gif2mp4, isURL } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

const VALID_PARSER_PATTERN =
	/^(\["[^"]+"\]|\w+|\[(?!0+\d)\d+\])((\.\w+)|(:?\["[^"]+"\])|(?:\['[^']+'\])|\[(?!0+\d)\d+\])*$/g;

const CONTENT_TYPE_PATTERN = /^[a-z0-9!#$&^_-]+\/[a-z0-9!#$&^_.+-]+$/i;

function getNestedValue(obj, path) {
	const segments = path.replace(/\[["']?([^"'\]]+)["']?\]/g, '.$1').split('.');
	let current = obj;

	for (const segment of segments) {
		if (current == null) {return undefined;}

		current = current[segment];
	}

	return current;
}

function parseObject(obj, path) {
	try {
		if (!VALID_PARSER_PATTERN.test(path)) {
			throw new Error('Invalid parser');
		}

		VALID_PARSER_PATTERN.lastIndex = 0;

		const value = getNestedValue(obj, path);

		if (value === undefined) {
			const detail = `(reading '${path}')`;

			throw new Error(`Cannot read properties of undefined.\n${detail}\n${' '.repeat(detail.length)}^^^^`);
		}

		return typeof value === 'object' ? JSON.stringify(value, null, 2) : value;
	} catch (error) {
		return { error: true, message: error.message };
	}
}

async function fetchData(url, { method, headers, body }) {
	const response = await fetch(url, { method, headers, body });

	if (!response.ok) {
		return { error: true, message: response.statusText };
	}

	return response;
}

async function processJsonResponse(response, pathParser) {
	let json = await response.json();

	if (!pathParser) {return JSON.stringify(json, null, 2);}

	const parsed = parseObject(json, pathParser);

	if (parsed?.error) {return { error: true, message: parsed.message || 'Cannot parse json' };}

	return parsed;
}

async function processTextResponse(response, pathParser) {
	const text = await response.text();

	try {
		const json = JSON.parse(text);

		if (!pathParser) {return JSON.stringify(json, null, 2);}

		const parsed = parseObject(json, pathParser);

		if (parsed?.error) {return { error: true, message: parsed.message || 'Cannot parse json' };}

		return parsed;
	} catch {
		return text;
	}
}

async function sendGifAsVideo(fileBuffer, from, message, client) {
	const id = Date.now();
	const inputPath = `./src/media/temporary_files/input-${id}.gif`;
	const outputPath = `./src/media/temporary_files/output-${id}.mp4`;

	try {
		await fs.writeFile(inputPath, fileBuffer);
		const { output } = await gif2mp4(inputPath, outputPath);
		const videoBuffer = await fs.readFile(output);

		await client.send(from, { video: videoBuffer, gifPlayback: true }, { quoted: message });
	} finally {
		await fs.remove(inputPath).catch(() => {});
		await fs.remove(outputPath).catch(() => {});
	}
}

function resolveMessageType(mime) {
	if (mime.includes('gif') || mime.includes('video')) {return 'video';}

	if (mime.includes('image')) {return 'image';}

	return 'document';
}

export default defineCommand({
	name: 'fetch',
	minifiedDescription: 'HTTP Requests',
	description: 'Do a HTTP request and send the results.',
	usage:
		'!fetch\nUsage :\n!fetch `www.example.com` -X `POST/GET` -H `"key1: value1"` -H `"ke2: value2"` -d `"{...JSONObjects}"` -T "conte"',
	aliases: ['get'],
	category: 'Helper',
	cooldown: 10,
	limit: 3,
	status: 'enable',
	async run({ from, message, query }, client) {
		if (!query) {
			return await client.reply(from, 'Fetch expect <url> <?parser>', message);
		}

		let {
			_: queries,
			method,
			headers: rawHeaders,
			body,
			parser: queryParser,
			media,
			contentType
		} = yargsParser(query, {
			alias: {
				method: ['X'],
				headers: ['H'],
				body: ['d'],
				contentType: ['T'],
				parser: ['p'],
				media: ['m']
			},
			boolean: ['media'],
			configuration: {
				'short-option-groups': false,
				'strip-aliased': true
			}
		});

		const url = queries.find((v) => isURL(v));

		if (!url) {
			return await client.reply(from, 'Fetch expect <url>', message);
		}

		if (method && !/^(GET|POST)$/i.test(method)) {
			return await client.reply(from, 'Method must be `GET` or `POST` (case-insensitive).', message);
		}

		if (body && /^GET$/i.test(method)) {
			return await client.reply(from, '`GET` method cannot accept body.', message);
		}

		if (body && /^POST$/i.test(method)) {
			try {
				JSON.parse(body);
			} catch {
				return await client.reply(from, '`body` MUST be a valid JSON string.', message);
			}
		}

		if (contentType && !CONTENT_TYPE_PATTERN.test(contentType)) {
			return await client.reply(from, `Invalid content-type: "${contentType}"`, message);
		}

		method = Array.isArray(method) ? method[0] : method || 'GET';

		const headers = rawHeaders
			? [].concat(rawHeaders).reduce((acc, cur) => {
					if (!/^[^:\s]+:\s?.+$/.test(cur)) {
						client.reply(from, `Invalid header format: "${cur}" (expected "key: value")`, message);
						return acc;
					}

					const [key, ...rest] = cur.split(':');
					const value = rest.join(':').trim();

					if (key.toLowerCase() === 'content-type' && !CONTENT_TYPE_PATTERN.test(value)) {
						client.reply(from, `Invalid content-type: "${value}"`, message);
						return acc;
					}

					return { ...acc, [key.trim()]: value };
				}, {})
			: {};

		if (method === 'GET') {body = undefined;}

		if (body) {headers['content-type'] = 'application/json;charset=UTF-8';}

		try {
			const response = await fetchData(url, { method, headers, body });

			if (response.error) {
				return await client.reply(from, response.message, message);
			}

			const responseType = response.headers.get('content-type').split(';')[0];

			if (responseType === 'application/json') {
				const data = await processJsonResponse(response, queryParser);

				if (data?.error) {return await client.reply(from, data.message, message);}

				if (media && typeof data === 'string' && isURL(data)) {
					const mediaResponse = await fetch(data);
					const fileBuffer = Buffer.from(await mediaResponse.arrayBuffer());
					const { mime, ext } = await fileTypeFromBuffer(fileBuffer);

					if (mime.includes('gif')) {
						return await sendGifAsVideo(fileBuffer, from, message, client);
					}

					const messageType = resolveMessageType(mime);

					return await client.send(
						from,
						{
							[messageType]: fileBuffer,
							...(messageType === 'document' ? { fileName: `file.${ext}` } : {})
						},
						{ quoted: message }
					);
				}

				return await client.reply(from, data, message);
			}

			if (responseType.startsWith('text')) {
				const data = await processTextResponse(response, queryParser);

				return await client.reply(from, data, message);
			}

			const binaryData = Buffer.from(await response.arrayBuffer());
			const mimeBase = responseType.split('/')[0];
			const messageType = mimeBase === 'audio' || mimeBase === 'application' ? 'document' : mimeBase;
			const fileName = messageType === 'document' ? `file_fetched.${extension(responseType)}` : undefined;

			await client.send(from, {
				[messageType]: binaryData,
				...(fileName ? { fileName, mime: responseType } : {})
			});
		} catch (error) {
			console.log(error);
			await client.reply(from, error.message, message);
		}
	}
});
