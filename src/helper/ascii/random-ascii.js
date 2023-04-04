import fs from 'fs-extra';
import { spawn } from 'child_process';

export const printRandomAscii = async () => {
	const randomAscii = fs.readdirSync('./src/helper/ascii');

	spawn('bash', [`./src/helper/ascii/${randomAscii[Math.floor(Math.random() * randomAscii.length)]}`], {
		stdio: 'inherit'
	});
};
