import * as _ from 'baileys';
import { exec } from 'child_process';
import fs from 'fs';
import prettier from 'js-beautify';
import { format, inspect } from 'node:util';
import syntaxerror from 'syntax-error';

import configuration, * as c from '../../helper/config/connect.js';
import * as a from '../../helper/index.js';
import { cmdId } from '../../helper/modules/prefix.js';
import * as d from '../../index.js';
import { getSyntaxAdvice } from '../../utils/ai/syntax-check-agent.js';
import * as b from '../../utils/index.js';

const func = { ...a, ...b, ...c, ...d, ...configuration }; /* eslint-disable-line */
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const ANSI_REGEX = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
const WAProto = _.WAProto; /* eslint-disable-line */

const SYNTAX_OPTIONS = { allowReturnOutsideFunction: true, allowAwaitOutsideFunction: true, sourceType: 'module' };
const ADVICE_LANGUAGE = 'id';

class CustomArray extends Array {
	constructor(...args) {
		return typeof args[0] === 'number' ? super(Math.min(args[0], 10_000)) : super(...args);
	}
}

const print = (from, args, { message, client }) => client.reply(from, inspect(args, { showHidden: true }), message);

const encodeAdvicePayload = (payload) => Buffer.from(JSON.stringify(payload)).toString('base64url');

const decodeAdvicePayload = (payload) => {
	try {
		return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
	} catch {
		return null;
	}
};

async function sendEvalErrorWithAdvice(ctx, client, error, code, syntaxes = '') {
	const builder = new client.TemplateBuilder.Native();
	const payload = encodeAdvicePayload({
		errorName: error?.name || 'Error',
		message: error?.message || String(error),
		code: String(code || ''),
		syntax: String(syntaxes || '')
	});
	const button = builder.button.reply({
		display: 'Get advice from Agent',
		id: cmdId(ctx.cmd, `--advice ${payload}`, ctx)
	});
	const summary = `\`ERROR\`\n\nType : ${error?.name || 'Error'}\nMessage : ${error?.message || String(error)}`;
	const body = syntaxes ? `${summary}\n\n${syntaxes.trim()}` : summary;

	await builder.destination(ctx.from).body(body).footer('Eval error').buttons(button).send();
}

function checkSyntax(code) {
	const err = syntaxerror(code, 'Execution Function', SYNTAX_OPTIONS);

	return err ? `\`\`\`${err}\`\`\`\n\n` : '';
}

async function evalReturn(ctx, client) {
	const {
		from,
		query,
		body,
		extractMediaData,
		mediaData,
		type,
		typeQuoted,
		adminGroups,
		participantsGroup,
		pushname,
		bodyQuoted
	} = ctx;
	const quoted = ctx.message;
	let output;
	let syntaxes = '';

	try {
		const FnType = /await/.test(body) ? AsyncFunction : Function;
		const code = `return ${query}`;
		const fn = new FnType(
			'print',
			'client',
			'message',
			'fs',
			'from',
			'extractMediaData',
			'mediaData',
			'type',
			'typeQuoted',
			'body',
			'adminGroups',
			'participants',
			'pushname',
			'bodyQuoted',
			code
		);

		output = await fn.call(
			client,
			(...a) => client.reply(from, format(...a), quoted),
			client,
			quoted,
			fs,
			from,
			extractMediaData,
			mediaData,
			type,
			typeQuoted,
			body,
			adminGroups,
			participantsGroup,
			pushname,
			bodyQuoted
		);
	} catch (e) {
		syntaxes = checkSyntax(query);
		await sendEvalErrorWithAdvice(ctx, client, e, query, syntaxes);
		return;
	}

	client.reply(from, inspect(output, { showHidden: true, depth: 4 }), quoted);
}

async function evalShell(ctx, client) {
	const { from, body } = ctx;
	const quoted = ctx.message;

	exec(body.slice(3), async (err, stdout) => {
		if (err) {
			return await client.reply(from, format(err), quoted);
		}

		await client.reply(from, format(stdout.replace(ANSI_REGEX, '').trim()), quoted);
	});
}

async function evalArrow(ctx, client) {
	const { from, query } = ctx;
	const quoted = ctx.message;
	const prelude =
		'const { mediaData, extractMediaData, type, typeQuoted, body, args, mention, bodyQuoted, sender, isGroup, isAdmin, isBotAdmin, pushname, groupMetadata, adminGroups, participantsGroup, settings } = ctx;\nconst message = ctx.message;';

	try {
		if (/\/s$/.test(query)) {
			const code = query.replace(/\/s$/, '');

			print(from, eval(prettier.js_beautify(`${prelude}\n${code}`)), { message: quoted, client });
		} else {
			const wrapped = prettier.js_beautify(`(async () => { ${prelude}\n${query} })()`);

			print(from, await eval(wrapped), { message: quoted, client });
		}
	} catch (e) {
		const wrapped = `(async () => { ${prelude}\n${query} })()`;

		const syntaxes = checkSyntax(wrapped);

		await sendEvalErrorWithAdvice(ctx, client, e, query, syntaxes);
	}
}

async function evalBang(ctx, client, store) {
	const { from, query, groupMetadata, args } = ctx;
	const quoted = ctx.message;
	let output;
	let syntaxes = '';
	const code = `return ${query}`;

	try {
		let i = 15;
		const exportsly = { exports: {} };
		const fn = new AsyncFunction(
			'print',
			'message',
			'client',
			'store',
			'Array',
			'process',
			'args',
			'groupMetadata',
			'exports',
			'argument',
			code
		);

		output = await fn.call(
			client,
			async (...a) => {
				if (--i < 1) {
					return;
				}

				return await client.reply(from, format(...a), quoted);
			},
			quoted,
			client,
			store,
			CustomArray,
			process,
			args,
			groupMetadata,
			exportsly,
			exportsly.exports,
			[client, quoted]
		);
	} catch (e) {
		syntaxes = checkSyntax(query);
		await sendEvalErrorWithAdvice(ctx, client, e, query, syntaxes);
		return;
	}

	client.reply(from, inspect(output, { showHidden: true, depth: 4 }), quoted);
}

export default {
	name: 'eval',
	minifiedDescription: 'Evaluate Code',
	description: 'Evaluates code.',
	usage: '!eval `<code>`',
	aliases: ['/>', '$>', '=>', '!>'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run(message, client, store) {
		const { isOwner, isBotInstance, from, body, query, args, cmd } = message;

		if (!isOwner) {
			return await client.reply(from, 'You are not allowed to use this command', message.message);
		}

		if (!query) {
			return await client.reply(from, 'Please specify code to evaluate', message.message);
		}

		if (args?.[1] === '--advice') {
			const payload = decodeAdvicePayload(args.slice(2).join(' '));

			if (!payload) {
				return await client.reply(from, 'Invalid advice payload.', message.message);
			}

			const advice = await getSyntaxAdvice({
				filename: 'eval',
				error: payload.errorName || 'Error',
				line: 0,
				column: 0,
				code: payload.code || '',
				language: ADVICE_LANGUAGE
			});

			if (!advice) {
				return await client.reply(from, 'No advice available.', message.message);
			}

			return await client.reply(from, advice.trim(), message.message);
		}

		if (isBotInstance) {
			return;
		}

		if (body.startsWith('/> ')) {
			return evalReturn(message, client);
		}

		if (body.startsWith('$> ')) {
			return evalShell(message, client);
		}

		if (body.startsWith('=> ')) {
			return evalArrow(message, client);
		}

		if (body.startsWith('!> ')) {
			return evalBang(message, client, store);
		}
	}
};

global.prints = print;

const temp = async (names, func) => {
	/* eslint-disable-line */
	if (!/^[a-z0-9_]+$/i.test(names)) {
		return new Error('Invalid name.');
	}

	if (Object.keys(func).includes(names)) {
		return new Error('Function already exists in the script.');
	}

	if (Object.keys(global).includes(names)) {
		return new Error('Function already exists in the temporary functions.');
	}

	if (typeof func !== 'function') {
		return new Error('Argument is not a function.');
	}

	func = prettier.js_beautify(func.toString());
	func = prettier.js_beautify(
		func.split('\n').insert(1, 'try {').insert(-1, '} catch(e) { print(false, format(e))}').join('\n')
	);
	global[names] = func.includes('await')
		? await new AsyncFunction('print', `return ${func}`)()
		: new Function('print', `return ${func}`)();
	global.functions = { ...global.functions, [names]: global[names] };
	return func;
};

const clear = (names) => {
	/* eslint-disable-line */
	if (typeof names === 'function') {
		for (const key in global.functions) {
			if (global.functions[key] === names) {
				names = key;
				break;
			}
		}
	}

	if (!/^[a-z0-9_]+$/i.test(names)) {
		return new Error('Invalid name.');
	}

	if (!Object.keys(global).includes(names)) {
		return new Error('Function does not exist.');
	}

	const capt = `Function is deleted\n\n${global[names]}`;

	delete global[names];
	delete global.functions[names];
	return capt;
};

const check = (names) => {
	/* eslint-disable-line */
	if (typeof names === 'function') {
		for (const key in global.functions) {
			if (global.functions[key] === names) {
				names = key;
				break;
			}
		}
	}

	if (!/^[a-z0-9_]+$/i.test(names)) {
		return new Error('Invalid name.');
	}

	if (!Object.keys(global).includes(names)) {
		return new Error('Function does not exist.');
	}

	return global[names].toString();
};
