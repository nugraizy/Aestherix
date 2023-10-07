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
	   --limit_reset, -l     Enable Auto-reset user's limit.
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
			read_only: { type: 'boolean', shortFlag: 'y' },
			auto_read: { type: 'boolean', shortFlag: 'r' },
			restrict: { type: 'boolean', shortFlag: 'e' },
			only_logs: { type: 'boolean', shortFlag: 'o' },
			no_logs: { type: 'boolean', shortFlag: 'n' },
			self_mode: { type: 'boolean', shortFlag: 's' },
			debug_mode: { type: 'boolean', shortFlag: 'g' },
			multi_cmd: { type: 'boolean', shortFlag: 'm' },
			rainbow: { type: 'boolean', shortFlag: 'b' },
			trace: { type: 'boolean', shortFlag: 't' },
			help: { type: 'boolean', shortFlag: 'h' },
			prefix: { type: 'string', shortFlag: 'p' },
			watch: { type: 'boolean', shortFlag: 'w' },
			cool_down: { type: 'boolean', shortFlag: 'c' },
			auto_correct: { type: 'boolean', shortFlag: 'a' },
			no_load: { type: 'boolean', shortFlag: 'v' },
			json: { type: 'boolean', shortFlag: 'j' },
			reset: { type: 'boolean', shortFlag: 'k' },
			story: { type: 'boolean', shortFlag: 'q' },
			offline: { type: 'boolean', shortFlag: 'f' },
			no_call: { type: 'boolean', shortFlag: 'd' },
			insta_notifier: { type: 'boolean', shortFlag: 'i' },
			limit_reset: { type: 'boolean', shortFlag: 'l' },
			reset_on_start: { type: 'boolean', shortFlag: 'x' },
			no_limit: { type: 'boolean', shortFlag: 'u' },
			pair_mode: { type: 'boolean', shortFlag: 'z' }
		}
	});
