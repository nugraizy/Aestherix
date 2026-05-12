/**
 * Werewolf — English string table. Keys mirror id.js 1:1.
 */

export default {
	success: {
		join: 'You joined the Werewolf game. Wait for the room master to start.',
		starting: 'The game is starting. The bot is shuffling roles and will DM each player their role when ready.',
		killWerewolf: 'You killed {0}.',
		killedByWerewolf: 'You were killed by a Werewolf. Stay silent for the rest of the game.',
		voted: 'Your vote has been recorded.',
		exit: 'You left the Werewolf game.',
		delete: 'Werewolf session deleted.',
		guarded: 'You are guarding {0} tonight. They will sleep safely.',
		exitAndDelete: 'The lobby is empty so the session was closed automatically.',
		healed: 'You used your healing potion on {0}. They survive the night.',
		poisoned: 'You poisoned {0}. They will die tonight.',
		loversPicked: 'You bound {0} and {1} as lovers.',
		loverNotice:
			'Cupid has bound you as a lover of {0}. If one of you dies, the other dies from heartbreak.',
		shotFired: 'With your last breath you shot {0} dead.',
		peekAttempt: 'You peek at the Werewolf chat tonight.',
		convertCast: 'You turned {0} into a Werewolf. They are on your side now.',
		langChanged: 'Game language set to {0}.'
	},
	errors: {
		afk: [
			'This session ended because the group failed to cast any votes 3 times in a row.',
			'The game ended due to 3 consecutive silent voting rounds.',
			'Game over: voting was idle 3 times in a row.'
		],
		notRoomMaster: 'You are not the room master.',
		notEnoughPlayer: 'Not enough players yet — need {0} or more (currently {1}).',
		tooManyPlayers: 'The room is full ({0}/{1}).',
		started: 'The game has already started. Wait for it to finish.',
		joined: 'You already joined this room.',
		full: 'The room is full. Wait for this game to finish.',
		wrongRole: 'Your role is not {0}, it is {1}.',
		wrongKill: 'You cannot kill a fellow Werewolf.',
		alreadyAction: 'You already acted this round. Wait for the next night.',
		protected:
			'You tried to kill a guarded player. Your identity might have been exposed — lie convincingly if anyone accuses you!',
		protectedMessage:
			'A wolf tried to kill you tonight, but the Guard protected you. You are safe for now — stay alert!',
		wrongKillProtected:
			'Werewolf {0} tried to kill you, but since you were being guarded, you survived. Stay alert for the next night.',
		dead: 'You are dead. Watch the game quietly until it ends.',
		wrongTime: 'Not the right time for this action. Expected {0}, currently {1}.',
		victimAlreadyDead: 'The player you tried to {0} is already dead.',
		alreadyVoted: 'You already voted this round.',
		gameStarted: 'The game is already underway — you cannot leave now.',
		noSessionExist: 'No Werewolf session exists. Create one with newGame.',
		gameStartedTryingToDelete: 'The session has already started. Wait until it ends.',
		gameStartedTryingToMakeNewOne: 'The session is already running. Wait until it ends and create a new one.',
		gameExistsTryingToMakeNewOne: 'A session already exists in this group. Delete it before creating a new one.',
		notJoined: 'You have not joined this Werewolf session.',
		cantActionSelf: 'You cannot {0} yourself.',
		targetMissing: 'That player is not in the game.',
		targetDead: 'That player is already dead.',
		guardRepeatTarget: 'You cannot guard the same player two nights in a row.',
		witchHealUsed: 'Your healing potion is already used up.',
		witchPoisonUsed: 'Your poison potion is already used up.',
		cupidFirstNightOnly: 'Cupid can only bind lovers on the first night.',
		alphaConvertUsed: 'You have already converted someone into a Werewolf.',
		wrongAction: 'That action does not match your role.',
		groupOnly: 'This command only works in groups.',
		unknownLocale: 'Unknown language. Use "id" or "en".'
	},
	nightTime: [
		'Night has fallen. Off to bed — but beware the Werewolves stalking the village.\n\nNight actors: you have {0} seconds. Make your move!',
		'Rest up. Night has come.\n\nNight actors: you have {0} seconds to act.',
		'Sleep — and stay alert. Wolves are out.\n\nNight actors: you have {0} seconds.'
	],
	dayTime: {
		kill: [
			'Morning has come. The villagers find {0} lifeless in the street.',
			'Dawn breaks. Villagers stumble upon {0} with a severed head.',
			'The sun rises. Villagers follow a trail of blood and discover {0} torn apart.'
		],
		noKill: [
			'Morning has come. The weather is clear and no one is missing.',
			'A clear day — the villagers find no casualties from the night.',
			'The village wakes up safe — nobody was killed by the Werewolves tonight.'
		],
		voting: [
			'Time to vote. Pick someone to hang! Check your DMs for the voting buttons; the results will be posted here.',
			'The villagers gather to vote. Use your action now — the bot has DM\'d you the voting buttons.'
		]
	},
	lynchKillNotWerewolf: [
		'The villagers hang {0} — only to discover they were not a Werewolf, but a {1}.',
		'The village agrees to throw {0} into the volcano, but they were actually a {1}.',
		'{0} is executed as a suspected Werewolf. They die instantly — turns out they were a {1}.',
		'The villagers hang {0} — and realise too late that they were a {1}, not a Werewolf.'
	],
	lynchKillWerewolf: [
		'The villagers hang {0} — and yes, they were a Werewolf! Congratulations, villagers.',
		'{0} is thrown into the volcano and does NOT die instantly — proof they were a Werewolf.',
		'The village executes {0}. They were indeed a Werewolf.'
	],
	lynchDraws: [
		'The vote ended in a draw — no one is hanged today. Talk it out before voting next time.',
		'Today\'s vote is tied. Nobody hangs. Coordinate before voting.'
	],
	lynchNoOne: ['No one voted. If this happens 3 times in a row the game will end.'],
	roleDialogue: {
		villager:
			'You are a Villager. You have no special action — participate in daytime voting to root out the wolves.',
		werewolf:
			'You are a Werewolf. Each night you may kill one non-wolf player. Your fellow wolves are {0}.',
		'alpha-werewolf':
			'You are the Alpha Werewolf. In addition to hunting with the pack, once per game you may convert a Villager into a Werewolf.',
		seer: 'You are the Seer. Each night you may inspect one player to learn whether they are a Werewolf.',
		guard:
			'You are the Guard. Each night you may protect one player from a Werewolf kill. You cannot guard the same player two nights in a row, and you cannot guard yourself.',
		witch:
			'You are the Witch. Once per game you may save the wolves\' victim (heal), and once per game you may poison anyone (poison).',
		hunter:
			'You are the Hunter. If you die (either at night or by being lynched), you may shoot one other player as revenge.',
		cupid:
			'You are Cupid. On the first night pick two players to bind as lovers. If either dies, the other dies too.',
		'little-girl':
			'You are the Little Girl. You may peek at the Werewolves\' chat at night, but there is a 25% chance they catch and kill you.',
		jester:
			'You are the Jester. You have no night action, but if the village lynches you during voting, you win alone.'
	},
	roleAction: {
		seer: {
			guessing: [
				'You peeked at {0} and learned they are a {1}.',
				'A dream flashes by — you see {0} is a {1}.',
				'You wake in the middle of the night with a certainty: {0} is a {1}.'
			],
			notGuessingWerewolf: [
				'You peeked at {0} and confirmed they are not a Werewolf.',
				'A dream told you {0} is not a Werewolf.',
				'Your instinct says {0} is not a Werewolf — probably.'
			]
		},
		guard: [
			'You are lucky — the Guard is protecting you tonight. The wolves cannot kill you.',
			'The Guard has you under protection tonight; wolves cannot kill you.'
		],
		littleGirlCaught: 'The wolves caught you peeking at their chat and tore you apart.',
		hunterRevengePrompt: 'Your last breath arrives. Shoot one player as revenge — or die with no shot.'
	},
	prompts: {
		nightActionTitle: '🌙 Night phase',
		nightActionFooter: 'Night action — pick a target.',
		votingTitle: '☀️ Voting time',
		votingFooter: 'Pick one player to hang.',
		lobbyNewGame: 'Werewolf game created.',
		lobbyAlreadyExists: 'A session already exists in this group. Tap Join to enter.',
		lobbyJoin: 'Join',
		lobbyStart: 'Start',
		lobbyExit: 'Leave',
		lobbyDelete: 'Delete',
		buttonNext: '➡️ Next',
		buttonPrev: '⬅️ Back',
		buttonCancel: 'Cancel'
	},
	winner: {
		werewolf: 'The Werewolves win! Congratulations to the wolf team.',
		village: 'The Villagers win! Congratulations to the good team.',
		jester: 'The Jester tricked the village into lynching them and wins solo!',
		lovers: 'The lovers are the last survivors and win together!'
	},
	warning: {
		nightIdle: 'No one acted tonight. Please stay engaged or the game will crawl.'
	},
	help: 'How to play Werewolf:\n• .ww newGame — create the lobby\n• .ww join — join the lobby\n• .ww start — start the game (room master only)\n• .ww exit — leave (lobby only)\n• .ww delete — delete the session (lobby only)\n• .ww kill <n> — werewolf kill\n• .ww seer <n> — seer inspection\n• .ww guard <n> — guard protection\n• .ww heal <n> / .ww poison <n> — witch actions\n• .ww shoot <n> — hunter revenge\n• .ww lovers <n1> <n2> — cupid binds lovers\n• .ww peek — little girl peeks\n• .ww convert <n> — alpha converts\n• .ww vote <n> — vote to lynch\n• .ww lang <id|en> — switch language'
};
