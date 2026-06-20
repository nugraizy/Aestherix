export default /** @type {const} */ ({
	errors: {
		invalidArgs: 'Invalid arguments.',
		provideNameContent: 'Usage: {prefix}template save "name" "content"',
		provideName: 'Usage: {prefix}template use "name" key1="value1"',
		notFound: 'Template "{0}" not found.'
	},
	template: {
		title: '*Message Templates*',
		usage: 'Usage:\n• {prefix}template save "name" "content with {placeholders}"\n• {prefix}template use "name" key1="value1" key2="value2"\n• {prefix}template list\n• {prefix}template remove "name"\n\nExample:\n• {prefix}template save "meeting" "📅 Meeting: {title}\n🕐 {time}\n📍 {location}"\n• {prefix}template use "meeting" title="Standup" time="9am" location="Zoom"',
		saved: 'Template "{0}" saved!',
		updated: 'Template "{0}" updated.',
		noTemplates: 'No templates in this chat.',
		listTitle: '*Templates*',
		listItem: '{0}. "{1}" (used {2}x) [ID: {3}]',
		removed: 'Template "{0}" removed.'
	}
});
