import { readJSON, writeJSON } from "../../index.js";

export const checkJSON = (dari) => {
	const data = readJSON("./Databases/Groups/settingsManager.json");
	const index = data.findIndex((v) => Object.keys(v)[0] == dari);
	if (index != -1) {
		return data[index];
	}
	return false;
};

export const pushDefaultSettings = (dari) => {
	const data = readJSON("./Databases/Groups/settingsManager.json");
	const index = data.findIndex((v) => Object.keys(v)[0] == dari);
	if (index == -1) {
		data.push({
			[dari]: {
				banned: [],
				welcome1: "disable",
				welcome1msg: "Welcome to {groupName}",
				welcome2: "disable",
				welcome2msg: "Welcome to {groupName}",
				left1: "disable",
				left1msg: "Bye bye {groupName}",
				left2: "disable",
				left2msg: "Bye bye {groupName}",
				antiDelete: "disable",
				antiGroupURL: "disable",
				antiURL: "disable",
				antiSpam: "disable",
				antiVirus: "disable",
				autoReader: "disable",
				antiNSFW: "disable",
				games: "disable",
			},
		});
		writeJSON("./Databases/Groups/settingsManager.json", data);
		return data[index];
	}
	return data[index];
};
