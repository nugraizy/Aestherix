import fs from 'fs-extra';

export const checkJSON = async (dari) => {
	const data = await fs.readJSON('./databases/groups/settingsManager.json');
	const index = data.findIndex((v) => Object.keys(v)[0] === dari);

	if (index != -1) {
		return data[index];
	}

	return false;
};

export const pushDefaultSettings = async (dari, groupName, groupDescription) => {
	const data = await fs.readJSON('./databases/groups/settingsManager.json');
	const index = data.findIndex((v) => Object.keys(v)[0] === dari);

	if (index === -1) {
		data.push({
			[dari]: {
				groupName,
				groupDescription,
				welcome1: 'disable',
				welcome1msg: 'Welcome to {groupName}',
				welcome2: 'disable',
				welcome2msg: 'Welcome to {groupName}',
				left1: 'disable',
				left1msg: 'Bye bye {groupName}',
				left2: 'disable',
				left2msg: 'Bye bye {groupName}',
				antiDelete: 'disable',
				antiGroupURL: 'disable',
				antiURL: 'disable',
				antiSpam: 'disable',
				antiVirus: 'disable',
				autoReader: 'disable',
				antiNSFW: 'disable',
				games: 'disable',
				notification: 'disable',
				banned: [],
			},
		});
		await fs.writeJSON('./databases/groups/settingsManager.json', data);
		return data[index];
	}

	return data[index];
};

export const updateSettings = async (setting, value, dari) => {
	const data = await fs.readJSON('./databases/groups/settingsManager.json');
	const index = data.findIndex((v) => Object.keys(v)[0] === dari);

	if (index === -1) {
		return false;
	}

	data[index][dari][setting] = value;
	await fs.writeJSON('./databases/groups/settingsManager.json', data);
	return data[index];
};
