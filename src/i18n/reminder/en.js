export default /** @type {const} */ ({
	errors: {
		invalidArgs: 'Invalid arguments.',
		provideTime: 'Please provide a time and message.\nExample: {prefix}remind 30m Check the oven',
		invalidTime: 'Invalid time format. Use: 30m, 1h, 2d, etc.',
		minTime: 'Minimum reminder time is 1 second.',
		maxTime: 'Maximum reminder time is 30 days.',
		provideId: 'Please provide a reminder ID. Use *{prefix}remind list* to see IDs.',
		notFound: 'Reminder not found.'
	},
	reminder: {
		title: '*Reminder System*',
		usage: 'Usage:\n• {prefix}remind 30m Check the oven\n• {prefix}remind 1h Meeting with team\n• {prefix}remind 2d Pay bills\n• {prefix}remind list\n• {prefix}remind cancel <id>\n• {prefix}remind cancelall\n\nTime units: s (seconds), m (minutes), h (hours), d (days)',
		set: '⏰ Reminder set!\n\nMessage: {0}\nTime: {1}\nID: {2}',
		noReminders: 'You have no active reminders.',
		listTitle: '*Your Reminders*',
		listItem: '{0}. {1} ({2}) [ID: {3}]',
		dueNow: 'Due now',
		cancelled: 'Reminder cancelled.',
		cancelledAll: 'Cancelled {0} reminder(s).',
		reminderFor: 'For: {0}'
	}
});
