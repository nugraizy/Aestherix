/**
 * Werewolf — event name constants.
 *
 * Every domain event fired by the werewolf module flows through one of these
 * names. The `src/handlers/game_handlers/werewolf.js` handler subscribes to
 * them and translates each into WhatsApp messages via the UI layer.
 *
 * Using string constants (not a freeze'd enum) keeps the bundle tiny while
 * still giving one canonical definition of each event name.
 */

export const EVENTS = {
	PHASE_CHANGED: 'werewolf:phaseChanged',
	ROLES_ASSIGNED: 'werewolf:rolesAssigned',
	MORNING_REPORT: 'werewolf:morningReport',
	VOTING_OPENED: 'werewolf:votingOpened',
	VOTING_CLOSED: 'werewolf:votingClosed',
	ACTION_REQUESTED: 'werewolf:actionRequested',
	ACTION_CONFIRMED: 'werewolf:actionConfirmed',
	HUNTER_REVENGE: 'werewolf:hunterRevenge',
	GAME_ENDED: 'werewolf:gameEnded',
	ERROR_REPORTED: 'werewolf:errorReported',
	WARNING: 'werewolf:warning'
};
