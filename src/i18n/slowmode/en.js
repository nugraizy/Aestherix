export default /** @type {const} */ ({
	errors: {
		invalidArgs: 'Invalid arguments.',
		groupOnly: 'This command only works in groups.',
		adminOnly: 'Only admins can use this command.',
		invalidDuration: 'Please specify a duration between 1 and 3600 seconds.',
		notSet: 'Slow mode is not set for this group.'
	},
	slowmode: {
		title: '*Slow Mode*',
		usage: 'Usage:\n• {prefix}slowmode set 30 — 30 seconds between messages\n• {prefix}slowmode off — Disable slow mode\n• {prefix}slowmode on — Re-enable slow mode\n• {prefix}slowmode remove — Remove slow mode completely\n• {prefix}slowmode status — Show current settings\n\nNon-admin members will be rate-limited.',
		enabled: 'Slow mode enabled!\n\nDuration: {0} seconds between messages\nAdmins excluded: Yes',
		disabled: 'Slow mode disabled.',
		removed: 'Slow mode removed.',
		enabledStatus: 'Slow mode enabled.',
		statusTitle: '*Slow Mode Status*',
		status: 'Status: {0}\nDuration: {1} seconds\nAdmins excluded: {2}',
		active: '✅ Enabled',
		inactive: '❌ Disabled',
		yes: 'Yes',
		no: 'No',
		rateLimited: '⏳ Slow mode active. Please wait {0} seconds.'
	}
});
