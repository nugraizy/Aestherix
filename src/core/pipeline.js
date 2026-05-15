import { fetchBUFFER } from '../utils/modules/index.js';

const MAX_PIPELINE_DEPTH = 3;

const UNPIPEABLE_CATEGORIES = new Set(['Owner', 'Games', 'Moderation']);

const MEDIA_ONLY_COMMANDS = new Set([
	'sticker', 'stickers', 'st', 'stk', 's', 'sgif',
	'removebg', 'trigger', 'pet', 'audiobook',
	'voiceremover', 'soundremover'
]);

const TEXT_ONLY_COMMANDS = new Set([
	'google', 'brainly', 'translate', 'define'
]);

class CapturingClient {
	#real;
	captured = [];

	constructor(realClient) {
		this.#real = realClient;

		return new Proxy(this, {
			get(target, prop) {
				if (prop === 'send' || prop === 'reply' || prop === 'captured') {
					return target[prop];
				}

				const value = target.#real[prop];

				return typeof value === 'function' ? value.bind(target.#real) : value;
			}
		});
	}

	async send(jid, content, opts) {
		this.captured.push(content);
	}

	async reply(jid, text, quoted) {
		this.captured.push(typeof text === 'string' ? { text } : text);
	}
}

class PipedClient {
	#real;
	#buffer;

	constructor(realClient, buffer) {
		this.#real = realClient;
		this.#buffer = buffer;

		return new Proxy(this, {
			get(target, prop) {
				if (prop === 'downloadMediaMessage') {
					return () => Promise.resolve(target.#buffer);
				}

				const value = target.#real[prop];

				return typeof value === 'function' ? value.bind(target.#real) : value;
			}
		});
	}
}

async function resolveMedia(value) {
	if (Buffer.isBuffer(value)) {
		return value;
	}

	if (value?.url) {
		return fetchBUFFER(value.url);
	}

	return null;
}

async function extractOutput(captured) {
	if (!captured.length) {
		return null;
	}

	for (const content of captured) {
		if (content?.image) {
			const buffer = await resolveMedia(content.image);

			if (buffer) {
				return { type: 'media', mediaType: 'imageMessage', buffer, caption: content.caption };
			}
		}

		if (content?.video) {
			const buffer = await resolveMedia(content.video);

			if (buffer) {
				return { type: 'media', mediaType: 'videoMessage', buffer, caption: content.caption };
			}
		}

		if (content?.audio) {
			const buffer = await resolveMedia(content.audio);

			if (buffer) {
				return { type: 'media', mediaType: 'audioMessage', buffer };
			}
		}

		if (content?.sticker) {
			const buffer = await resolveMedia(content.sticker);

			if (buffer) {
				return { type: 'media', mediaType: 'stickerMessage', buffer };
			}
		}

		if (content?.document) {
			const buffer = await resolveMedia(content.document);

			if (buffer) {
				return { type: 'media', mediaType: 'documentMessage', buffer, mimetype: content.mimetype };
			}
		}
	}

	const first = captured[0];

	if (first?.text) {
		return { type: 'text', text: first.text };
	}

	return null;
}

export class PipelineExecutor {
	#client;
	#ctx;
	#router;
	#guard;
	#run;
	#log;

	constructor(client, ctx, router, { guard, run, log }) {
		this.#client = client;
		this.#ctx = ctx;
		this.#router = router;
		this.#guard = guard;
		this.#run = run;
		this.#log = log;
	}

	async execute(stages) {
		if (stages.length > MAX_PIPELINE_DEPTH) {
			await this.#client.reply(
				this.#ctx.from,
				`Pipeline too deep. Maximum ${MAX_PIPELINE_DEPTH} stages allowed.`,
				this.#ctx.message
			);
			return;
		}

		const pipelineGuard = this.#validatePipeline(stages);

		if (pipelineGuard) {
			await this.#client.reply(this.#ctx.from, pipelineGuard, this.#ctx.message);
			return;
		}

		let previousOutput = null;

		for (let i = 0; i < stages.length; i++) {
			const isLast = i === stages.length - 1;
			const body = stages[i];
			const resolved = this.#router.resolve(body);

			if (!resolved?.command) {
				await this.#sendFallback(previousOutput, `Pipeline failed: command not found in stage ${i + 1}.`);
				return;
			}

			const inputGuard = this.#validateInput(resolved.command, previousOutput, i);

			if (inputGuard) {
				await this.#sendFallback(previousOutput, inputGuard);
				return;
			}

			const stageCtx = this.#buildStageContext(body, resolved, previousOutput);

			this.#log(stageCtx);

			const guardResult = await this.#guard(stageCtx, resolved.command, this.#client);

			if (guardResult === 'skip') {
				await this.#sendFallback(previousOutput);
				return;
			}

			const stageClient = this.#buildStageClient(isLast, previousOutput);

			if (isLast) {
				await this.#run(stageCtx, resolved.command, stageClient);
				return;
			}

			const capturingClient = new CapturingClient(stageClient);

			try {
				await resolved.command.run(stageCtx, capturingClient, null);
			} catch (err) {
				await this.#sendFallback(previousOutput, `Pipeline failed at stage ${i + 1} (${resolved.cmdName}): ${err.message}`);
				return;
			}

			const output = await extractOutput(capturingClient.captured);

			if (!output) {
				await this.#sendFallback(
					previousOutput,
					`Pipeline failed: stage ${i + 1} (${resolved.cmdName}) produced no output.`
				);
				return;
			}

			previousOutput = output;
		}
	}

	async #sendFallback(previousOutput, errorMessage) {
		if (errorMessage) {
			await this.#client.reply(this.#ctx.from, errorMessage, this.#ctx.message);
		}

		if (!previousOutput) {
			return;
		}

		if (previousOutput.type === 'text') {
			await this.#client.send(this.#ctx.from, { text: previousOutput.text }, { quoted: this.#ctx.message });
			return;
		}

		const mediaKey = {
			imageMessage: 'image',
			videoMessage: 'video',
			audioMessage: 'audio',
			stickerMessage: 'sticker',
			documentMessage: 'document'
		}[previousOutput.mediaType];

		if (mediaKey) {
			const content = { [mediaKey]: previousOutput.buffer };

			if (previousOutput.caption) {
				content.caption = previousOutput.caption;
			}

			await this.#client.send(this.#ctx.from, content, { quoted: this.#ctx.message });
		}
	}

	#validatePipeline(stages) {
		for (let i = 0; i < stages.length; i++) {
			const resolved = this.#router.resolve(stages[i]);

			if (!resolved?.command) {
				continue;
			}

			const { command } = resolved;
			const isIntermediate = i < stages.length - 1;

			if (resolved.isEval) {
				return 'Pipeline blocked: eval commands cannot be piped.';
			}

			if (UNPIPEABLE_CATEGORIES.has(command.category)) {
				return `Pipeline blocked: ${command.category} commands cannot be piped (stage ${i + 1}: ${command.name}).`;
			}

			if (isIntermediate && command.name === 'anonymous') {
				return `Pipeline blocked: interactive commands cannot be used as intermediate stages (stage ${i + 1}: ${command.name}).`;
			}
		}

		return null;
	}

	#validateInput(command, previousOutput, stageIndex) {
		if (!previousOutput || stageIndex === 0) {
			return null;
		}

		if (MEDIA_ONLY_COMMANDS.has(command.name) && previousOutput.type === 'text') {
			return `Pipeline blocked: stage ${stageIndex + 1} (${command.name}) requires media input, but received text.`;
		}

		if (TEXT_ONLY_COMMANDS.has(command.name) && previousOutput.type === 'media') {
			return `Pipeline blocked: stage ${stageIndex + 1} (${command.name}) requires text input, but received media.`;
		}

		return null;
	}

	#buildStageClient(isLast, previousOutput) {
		if (previousOutput?.type === 'media') {
			return new PipedClient(this.#client, previousOutput.buffer);
		}

		return this.#client;
	}

	#buildStageContext(body, resolved, previousOutput) {
		const overrides = {
			body,
			args: resolved.args,
			cmd: resolved.cmdName,
			prefix: resolved.prefix,
			isEval: resolved.isEval,
			isCmd: true,
			query: resolved.query
		};

		if (!previousOutput) {
			return this.#ctx.derive(overrides);
		}

		if (previousOutput.type === 'text') {
			overrides.query = previousOutput.text;
			overrides.args = [resolved.args[0], ...previousOutput.text.split(/ +/g)];
			overrides.body = `${resolved.args[0]} ${previousOutput.text}`;
			return this.#ctx.derive(overrides);
		}

		return this.#ctx.synthetic({
			...overrides,
			pipedMedia: previousOutput
		});
	}
}
