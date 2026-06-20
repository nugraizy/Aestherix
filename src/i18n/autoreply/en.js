export default /** @type {const} */ ({
	errors: {
		invalidArgs: 'Invalid arguments.',
		providePattern: 'Usage: {prefix}autoreply add "keyword" "response"',
		provideId: 'Please provide an auto-reply ID. Use *{prefix}autoreply list* to see IDs.',
		notFound: 'Auto-reply not found.'
	},
	autoreply: {
		title: '*Auto-Reply System*',
		usage: 'Usage:\n• {prefix}autoreply add "hello" "Hi there!"\n• {prefix}autoreply add "price" "Check our website!"\n• {prefix}autoreply add regex "\\d{4}" "That\'s a number!"\n• {prefix}autoreply add "test" "Response" --cd 60\n• {prefix}autoreply list\n• {prefix}autoreply remove <id>\n• {prefix}autoreply removeall\n\nOptions:\n• regex — Use regex pattern matching\n• --cd <seconds> — Cooldown between triggers',
		added: '✅ Auto-reply added!\n\nPattern: "{0}"{1}\nResponse: "{2}"{3}\nID: {4}',
		regex: ' [regex]',
		cooldown: ' [cooldown: {0}s]',
		noReplies: 'No auto-replies in this chat.',
		listTitle: '*Auto-Replies*',
		listItem: '{0}. "{1}" → "{2}"{3}{4} [ID: {5}]',
		removed: 'Auto-reply removed.',
		removedAll: 'Removed {0} auto-reply(ies).'
	}
});
