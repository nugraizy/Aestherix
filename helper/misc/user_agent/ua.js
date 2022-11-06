import { randomize, readJSON } from '../../modules/functions.js';

/**
 * Randomize User-Agent.
 * @returns {string}
 */
export const UA = () => randomize(readJSON('./helper/misc/user_agent/ua.json'));
