import { randomize, readJSON } from '../../Modules/functions.js';

export const UA = () => randomize(readJSON('./Helper/Misc/User-Agent/ua.json'));
