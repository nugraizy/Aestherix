const axios = require("axios");
const cheerio = require("cheerio");

async function profile2(username) {
  try {
    const { data } = await axios.get(
      `https://www.picuki.com/profile/${username}`
    );
    const $ = cheerio.load(data);

    const fullName =
      $(".profile-name-bottom").text().trim() !== ""
        ? $(".profile-name-bottom").text().trim()
        : "N/A";
    const userName = $(".profile-name-top").text().trim();
    const following = $(".follows").text().trim();
    const followers = $(".followed_by").text().trim();
    const bio =
      $(".profile-description").text().trim() !== ""
        ? $(".profile-description").text().trim()
        : "No Bio!";
    const totalPost = $(".total_posts").text().trim();
    const profilePicture = $(".profile-hd-link.launchLightbox").attr(
      "data-video-poster"
    );

    let post = [];
    let desc = [];
    let like = [];
    let comment = [];
    posts = $(".photo")
      .find("a > img")
      .each(function (i, elem) {
        post.push($(elem).attr("src"));
      });
    const descs = $(".photo-info")
      .find(".photo-description")
      .each(function (i, elem) {
        desc.push($(elem).text().trim());
      });
    const likes = $(".post-footer")
      .find(".likes_photo")
      .each(function (i, elem) {
        like.push($(elem).text().trim());
      });
    const comments = $(".post-footer")
      .find(".comments_photo")
      .each(function (i, elem) {
        comment.push($(elem).text().trim());
      })
      .text();

    const profile = {
      fullName: fullName,
      userName: userName,
      following: following,
      followers: followers,
      bio: bio,
      post: totalPost,
      thumb: profilePicture,
      latestPost: {
        thumb: post,
        desc: desc,
        like: like,
        comment: comment,
      },
    };
    return profile;
  } catch (error) {
    return error;
  }
}
profile2(process.argv.slice(2)).then(console.log);
