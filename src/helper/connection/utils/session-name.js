import fs from 'fs-extra';

const SETTINGS_PATH = './src/helper/config/settings.json';
const DEFAULT_SESSION_NAME = 'aestherix-bot';

let cachedSettings = null;

const loadSettings = async () => {
	if (cachedSettings) {
		return cachedSettings;
	}

	try {
		cachedSettings = await fs.readJSON(SETTINGS_PATH);
		return cachedSettings;
	} catch {
		cachedSettings = {};
		return cachedSettings;
	}
};

export const resolveSessionName = async (cliInput) => {
	const fromCli = String(cliInput || '').trim();

	if (fromCli) {
		return fromCli;
	}

	const settings = await loadSettings();
	const fromSettings = String(settings?.main_session || '').trim();

	return fromSettings || DEFAULT_SESSION_NAME;
};
