import { InstagramApi } from './instagram.js';

export const login = async (username, password) => {
	const instagram = new InstagramApi(username, password);

	const login = await instagram.account.login();

	login.account.writeLoginInfo();

	console.log('Saved to .env.instagram');
};
