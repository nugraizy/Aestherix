import { randomize, readJSON } from '../../modules/functions.js';

export const UA = () => randomize(readJSON('./helper/misc/user_agent/ua.json'));
