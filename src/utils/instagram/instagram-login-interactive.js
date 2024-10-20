import { input, password } from '@inquirer/prompts';
import _toggle from 'inquirer-toggle';
import { login } from './login.js';
const { default: toggle } = _toggle;

const loadFromEnv = async () => {
	const yesOrNo = await toggle({
		message: 'Do you want to load credentials from .env?',
		default: false,
		theme: {
			active: 'no',
			inactive: 'yes'
		}
	});
	if (!yesOrNo) {
		await import('dotenv/config.js');
		console.log('Credentials loaded from .env.');
		return true;
	}
	return false;
};

const catchError = async (e) => {
	if (e.name === 'ExitPromptError') {
		process.exit(0);
	} else {
		process.exit(0);
	}
};

const askForInput = async (message, promptFunc, mask) => {
	let input = await promptFunc({ message, mask }).catch(catchError);
	input = input.replace(/\s*/g, '');
	if (!input) {
		return await askForInput(message, promptFunc);
	}
	return input;
};

const askUsername = async () => await askForInput('Please type your username:', input);

const askPassword = async () => await askForInput('Please type your password:', password, true);

const maskPassword = (password) => {
	if (password.length <= 2) return password;
	const firstChar = password[0];
	const lastChar = password[password.length - 1];
	const maskedMiddle = '*'.repeat(password.length - 2);
	return `${firstChar}${maskedMiddle}${lastChar}`;
};

const askConfirmationForBoth = async (usernames, passwords) => {
	return await toggle({
		message: `Is this your username \`${usernames}\` and is this your password \`${maskPassword(passwords)}\`?`,
		default: false,
		theme: {
			active: 'no',
			inactive: 'yes'
		}
	}).catch(catchError);
};

const askConfirmation = async () => {
	while (true) {
		const usernames = await askUsername();
		const passwords = await askPassword();
		const isNotConfirmed = await askConfirmationForBoth(usernames, passwords);

		if (isNotConfirmed) {
			console.log("Let's try again.");
			continue;
		}

		return { usernames, passwords };
	}
};

const main = async () => {
	const loadedFromEnv = await loadFromEnv();

	if (loadedFromEnv) {
		const username = process.env.INSTAGRAM_USERNAME;
		const usernameConfirm = await toggle({
			message: `Is this your username ${username}?`,
			default: false,
			theme: {
				active: 'no',
				inactive: 'yes'
			}
		}).catch(catchError);

		if (!usernameConfirm) {
			const passwords = await askPassword();
			const isNotValid = await askConfirmationForBoth(username, passwords);

			if (!isNotValid) {
				console.log('Trying to login. Please wait.');
				return await login(username, passwords);
			}

			const { passwords: newPassword, usernames: newUsername } = await askConfirmation();

			console.log('Trying to login. Please wait.');

			await login(newUsername, newPassword);
		} else {
			const { passwords } = await askConfirmation();
			console.log('Trying to login. Please wait.');
			await login(username, passwords);
		}
	} else {
		const { passwords, usernames } = await askConfirmation();
		console.log('Trying to login. Please wait.');
		await login(usernames, passwords);
	}
};

main();
