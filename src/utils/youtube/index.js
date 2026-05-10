import { YouTubei } from './youtube.js';

export * from './channel.js';
export * from './live-stream.js';
export * from './youtube.js';

const youtube = new YouTubei();

export { youtube };
export default youtube;
