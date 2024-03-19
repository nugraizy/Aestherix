export const _api = 'https://api22-normal-c-useast2a.tiktokv.com/';
const _apiBase = (input) => `https://www.tiktok.com/${input}`;
export const _apiBaseVideo = (...input) => _apiBase(`@${input[0]}/video/${input[1]}`); // eslint-disable-line
