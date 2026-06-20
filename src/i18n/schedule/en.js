export default /** @type {const} */ ({
	errors: {
		invalidArgs: 'Invalid arguments.',
		provideSchedule: 'Usage: {prefix}schedule add <time> "message"\nExample: {prefix}schedule add 9:00 "Good morning!"',
		invalidTime: 'Invalid time format. Use: 9:00, daily, hourly, 14:30 mon, etc.',
		provideId: 'Please provide a schedule ID. Use *{prefix}schedule list* to see IDs.',
		notFound: 'Schedule not found.',
		failedCreate: 'Failed to create schedule. Invalid cron expression.'
	},
	schedule: {
		title: '*Message Scheduler*',
		usage: 'Usage:\n• {prefix}schedule add 9:00 "Good morning everyone!"\n• {prefix}schedule add daily "Daily reminder"\n• {prefix}schedule add 14:30 mon "Monday meeting"\n• {prefix}schedule list\n• {prefix}schedule cancel <id>\n• {prefix}schedule cancelall\n\nTime formats:\n• 9:00 — Every day at 9:00\n• daily — Every day at 9:00\n• hourly — Every hour\n• 14:30 mon — Every Monday at 14:30\n• weekly — Every Monday at 9:00\n• monthly — 1st of month at 9:00',
		created: '📅 Message scheduled!\n\nMessage: {0}\nSchedule: {1} ({2})\nID: {3}',
		noSchedules: 'No scheduled messages in this chat.',
		listTitle: '*Scheduled Messages*',
		listItem: '{0}. "{1}" ({2}) [ID: {3}]',
		cancelled: 'Schedule cancelled.',
		cancelledAll: 'Cancelled {0} schedule(s).'
	}
});
