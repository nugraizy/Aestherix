export default /** @type {const} */ ({
	errors: {
		invalidArgs: 'Invalid arguments.',
		groupOnly: 'This command only works in groups.',
		adminOnly: 'Only admins can use this command.',
		provideQuestion: 'Please provide a question and at least 2 options in quotes.\n\nExample: {prefix}poll "Best language?" "JavaScript" "Python"',
		provideMention: 'Please mention a user to kick.\n\nUsage: {prefix}poll kick @user "Should we kick?"',
		minOptions: 'Please provide at least 2 options.',
		maxOptions: 'Maximum 12 options allowed.',
		failedCreate: 'Failed to create poll: {0}'
	},
	poll: {
		title: '*Poll System*',
		usage: 'Usage:\n• {prefix}poll "Question" "Option 1" "Option 2"\n• {prefix}poll "Question" "Option 1" "Option 2" --announce 10\n• {prefix}poll "Question" "Option 1" "Option 2" --close 20\n• {prefix}poll "Question" "Option 1" "Option 2" --msg 5 "Reached {votes} votes!"\n• {prefix}poll kick @user "Should we kick?" --votes 5\n\nActions:\n• --announce <votes> — Announce results when X votes reached\n• --close <votes> — Close poll when X votes reached\n• --msg <votes> "message" — Send custom message when X votes reached\n• --votes <min> — Minimum votes required for kick',
		createdWithActions: '📊 Poll created with actions:\n{0}',
		announceAction: '• Announce results at {0} votes',
		closeAction: '• Close poll at {0} votes',
		messageAction: '• Message at {0} votes: "{1}"',
		results: '📊 *Poll Results*\n\n{0}\n\n{1}\n\nTotal votes: {2}',
		closed: '🔒 Poll closed!\n\n{0}\n\nTotal votes: {1}',
		kickCreated: '🗳️ Vote kick poll created!\n\nTarget: @{0}\nQuestion: {1}\nMin votes required: {2}\n\nIf "Yes" gets more votes than "No", the user will be kicked.',
		kickQuestion: 'Should we kick @{0}?',
		kickResults: '🗳️ *Vote Kick Results*\n\n{0}\n\n✅ Yes: {1}\n❌ No: {2}\n\n{3}',
		kicked: '@{0} has been kicked!',
		stays: 'The user stays!',
		failedKick: 'Failed to kick user: {0}',
		yes: 'Yes',
		no: 'No'
	}
});
