/**
 * Werewolf — button / message builders for the UI layer.
 *
 * These helpers produce pure data (plain objects) that the game handler
 * feeds into `client.instance.TemplateBuilder.Native`. Keeping them pure
 * lets the unit tests assert the exact button payloads without touching
 * Baileys or the socket.
 *
 * WhatsApp native reply buttons accept many entries per message (the
 * project's debug command uses up to 50), so we do not paginate — every
 * valid target gets its own button. If a game room is so large that the
 * UI feels crowded the user can still reply with the numeric index from
 * the message body ("!ww kill 3").
 */

import { cmdId } from '../../../../helper/modules/prefix.js';

const mentionSpan = (id) => `@${String(id).split('@')[0]}`;

/**
 * @typedef {{ id: string, name: string }} Target
 * @typedef {{ display: string, id: string }} ReplyButton
 */

/**
 * Build one quick-reply button per target.
 *
 * @param {{
 *   subcommand: string,
 *   roomId: string,
 *   targets: Target[],
 *   labelPrefix: string,
 *   ctx?: { prefix?: string }
 * }} args
 * @returns {ReplyButton[]}
 */
export const buildTargetButtons = ({ subcommand, roomId, targets, labelPrefix, ctx }) => {
	return targets.map((target, index) => ({
		display: `${labelPrefix} ${target.name}`,
		id: cmdId('ww', `${subcommand} ${index + 1} ${roomId}`, ctx)
	}));
};

/**
 * Build the accompanying numbered text body. Users who cannot tap buttons
 * can still reply with the index (e.g. "!ww kill 3").
 *
 * @param {Target[]} targets
 * @returns {string}
 */
export const buildTargetListBody = (targets) =>
	targets.map((target, index) => `${index + 1}. ${mentionSpan(target.id)} ${target.name}`).join('\n');

/**
 * Build the complete send-args for a "pick a target" action prompt.
 *
 * @param {{
 *   subcommand: string,
 *   roomId: string,
 *   targets: Target[],
 *   labelPrefix: string,
 *   bodyText: string,
 *   footerText: string,
 *   extraButtons?: ReplyButton[],
 *   ctx?: { prefix?: string }
 * }} args
 * @returns {{
 *   body: string,
 *   footer: string,
 *   buttons: ReplyButton[],
 *   mentions: string[]
 * }}
 */
export const buildTargetActionMessage = ({
	subcommand,
	roomId,
	targets,
	labelPrefix,
	bodyText,
	footerText,
	extraButtons = [],
	ctx
}) => {
	const list = buildTargetListBody(targets);
	const body = list.length > 0 ? `${bodyText}\n\n${list}` : bodyText;

	return {
		body,
		footer: footerText,
		buttons: [...buildTargetButtons({ subcommand, roomId, targets, labelPrefix, ctx }), ...extraButtons],
		mentions: targets.map((t) => t.id)
	};
};

/**
 * Build a lobby prompt — four static buttons (join, start, exit, delete).
 *
 * @param {{ roomId: string, labels: { join: string, start: string, exit: string, delete: string }, ctx?: { prefix?: string } }} args
 */
export const buildLobbyButtons = ({ roomId, labels, ctx }) => [
	{ display: labels.join, id: cmdId('ww', `join ${roomId}`, ctx) },
	{ display: labels.start, id: cmdId('ww', `start ${roomId}`, ctx) },
	{ display: labels.exit, id: cmdId('ww', `exit ${roomId}`, ctx) },
	{ display: labels.delete, id: cmdId('ww', `delete ${roomId}`, ctx) }
];
