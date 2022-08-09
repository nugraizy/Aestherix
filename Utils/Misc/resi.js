const axios = require("axios");
const formData = require("form-data");

(async () => {
  try {
    const asu = await axios.get("https://pluginongkoskirim.com/cek-resi/");
    const coki = asu.headers["set-cookie"].toString().replace("; path=/", "");
    const form = new formData();
    form.append("kurir", "anteraja");
    form.append("resi", "10005201831390");
    const post = await axios({
      url: "https://pluginongkoskirim.com/cek-tarif-ongkir/front/resi-amp?__amp_source_origin=https://pluginongkoskirim.com",
      method: "post",
      headers: {
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent": "GoogleBot",
        cookie: coki,
        ...form.getHeaders(),
      },
      data: form.getBuffer(),
    });
    console.log(post.data);
  } catch (error) {
    console.log(error);
  }
})();
