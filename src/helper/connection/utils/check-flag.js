import meow from 'meow';

const helpFlag = () => `
	 Usage
	   $ node . <session> <options>

	 Options
	   --prefix, -p          Set your custom prefix.
	   --read_only, -y       Read only.
	   --auto_read, -r       Auto read every incoming message.
	   --restrict, -e        Restrict every moderator commands.
	   --only_logs, -o       Only showing logs but will ignore every message and commands.
	   --no_logs, -n         Not showing any logs in the meantime still respond for any commands.
	   --self_mode, -s       Set self mode that only owner and the bot can use.
	   --debug_mode, -g      Show every metadata of any message.
	   --multi_cmd, -m       Loop every command on your script. Use | to seperate each commands.
	   --rainbow, -b         make your logs rainbow colors.
	   --trace, -t           Show errors.
	   --watch, -w           Watch every file on your script and reload it when it changed.
	   --cool_down, -c       Set cool down for every command.
	   --auto_correct, -a    Enable auto correct for every incoming command.
	   --no_load, -v         Disable module load animation.
	   --json, -j            Use JSON DB to store data of the WhatsApp connection.
	   --reset, -k           Reset your WhatsApp connection session, and restart the script.
	   --story, q            Auto download people story after the bot received the story.
	   --offline, -f         Set your current presence to offline.
	   --no_call, -d         Reject incoming call.
	   --insta_notifier, -i  Handle incoming Instagram DMs.
	   --limit_reset, -l	 Enable Auto-reset user's limit.
	   --reset_on_start, -x  Auto reset DB-Connections every start of the script.
	   --no_limit, -u        Set commands limit to None.
	   --help, -h            Show this message.

	 Examples
	   $ node . --read_only -t
 `;

export const parseCli = () =>
	meow(helpFlag(), {
		importMeta: import.meta,
		flags: {
			/* eslint-disable */
			read_only: { type: 'boolean', alias: 'y' },
			auto_read: { type: 'boolean', alias: 'r' },
			restrict: { type: 'boolean', alias: 'e' },
			only_logs: { type: 'boolean', alias: 'o' },
			no_logs: { type: 'boolean', alias: 'n' },
			self_mode: { type: 'boolean', alias: 's' },
			debug_mode: { type: 'boolean', alias: 'g' },
			multi_cmd: { type: 'boolean', alias: 'm' },
			rainbow: { type: 'boolean', alias: 'b' },
			trace: { type: 'boolean', alias: 't' },
			help: { type: 'boolean', alias: 'h' },
			prefix: { type: 'string', alias: 'p' },
			watch: { type: 'boolean', alias: 'w' },
			cool_down: { type: 'boolean', alias: 'c' },
			auto_correct: { type: 'boolean', alias: 'a' },
			no_load: { type: 'boolean', alias: 'v' },
			json: { type: 'boolean', alias: 'j' },
			reset: { type: 'boolean', alias: 'k' },
			story: { type: 'boolean', alias: 'q' },
			offline: { type: 'boolean', alias: 'f' },
			no_call: { type: 'boolean', alias: 'd' },
			insta_notifier: { type: 'boolean', alias: 'i' },
			limit_reset: { type: 'boolean', alias: 'l' },
			reset_on_start: { type: 'boolean', alias: 'x' },
			no_limit: { type: 'boolean', alias: 'u' }
		}
	});
