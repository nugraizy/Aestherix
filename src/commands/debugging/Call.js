import { encodeWAMessage, generateMessageID } from '@adiwajshing/baileys';
import crypto from 'crypto';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'call',
	description: 'Send call.',
	category: 'Debugging',
	usage: '!call',
	aliases: ['call'],
	cooldown: 5,
	limit: 0,
	status: 'enable',
	async run({ state, from }, client) {
		const buffer = encodeWAMessage({
			call: {
				callKey: new Uint8Array(crypto.webcrypto.getRandomValues(new Uint8Array(32)).buffer)
			}
		});

		const { ciphertext } = await client[botNum].signalRepository.encryptMessage({ jid: from, data: buffer });
		const content = [
			{ tag: 'audio', attrs: { rate: '16000', enc: 'opus' }, content: undefined },
			{ tag: 'audio', attrs: { rate: '8000', enc: 'opus' }, content: undefined }
		];

		content.push(
			...[
				{ tag: 'net', attrs: { medium: '3' }, content: undefined },
				{ tag: 'capability', attrs: { ver: '1' }, content: new Uint8Array([1, 4, 255, 131, 207, 4]) },
				{ tag: 'encopt', attrs: { keygen: '2' }, content: undefined },
				{
					tag: 'destination',
					attrs: {},
					content: [
						{
							tag: 'to',
							attrs: {
								jid: from
							},
							content: [
								{
									tag: 'enc',
									attrs: {
										v: '2',
										type: 'msg',
										count: '0'
									},
									content: ciphertext
								}
							]
						}
					]
				}
			]
		);
		const nodes = {
			tag: 'call',
			attrs: {
				to: from,
				id: generateMessageID()
			},
			content: [
				{
					tag: 'offer',
					attrs: {
						'call-id': crypto.randomBytes(16).toString('hex').substring(0, 64).toUpperCase(),
						'call-creator': state.creds.me.id
					},
					content: content
				}
			]
		};

		client[botNum].sendNode(nodes);
	}
};
