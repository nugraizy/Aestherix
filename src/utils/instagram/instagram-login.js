import '@dotenvx/dotenvx/config';
import { login } from './login.js';

const exit = () => process.exit(0);

if (!process.env.INSTAGRAM_USERNAME) {
	console.log('Write your username in the .env file');
	exit();
}

if (!process.env.INSTAGRAM_PASSWORD) {
	console.log('Write your password in the .env file');
	exit();
}

await login(process.env.INSTAGRAM_USERNAME, process.env.INSTAGRAM_PASSWORD);
