import YouTube from './youtube.js';

export * from './y2mate.js';
export * from './channel.js';
export * from './live-stream.js';

const youtube = new YouTube('v2');

export { youtube };
export default youtube;
