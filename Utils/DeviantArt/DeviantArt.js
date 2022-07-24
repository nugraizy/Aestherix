import Axios from "axios"

exports const DeviantArt = (query) => 
    new Promise((resolve, reject) => {
        Axios.get(`https://www.deviantart.com/_napi/da-browse/api/networkbar/search/deviations?q=${query}&cursor=MTQwYWI2MjA9MiY1OTBhY2FkMD0yNCZkMTc0YjZiYz0xNzIwNGY0YThiZDQ4ZGFhY2M5MDAzNzRlNGIzNjNiMQ`)
        .then(({ data }) => {
            const result = []
            data.deviations.forEach(v => {
                result.push({
                    nextCursor: data.nextCursor,
                    prevCursor: data.prevCursor,
                    id: v.deviationId,
                    title: v.title,
                    image: `${v.media.baseUri}${v.media.types[v.media.types.findIndex((x) => x.t == "social_preview")].c.replace("<prettyName>", v.media.prettyName)}?token=${v.media.token[0]}`,
                    published: v.publishedTime,
                    author: v.author.username,
                    comments: v.stats.comments,
                    favourites: v.stats.favourites,
                    views: v.stats.views,
                    downloads: v.stats.downloads,
                    source: v.url
                })
            })
            resolve(result)
        })
      .catch((e) => reject(e))
    })

// API DOWNLOAD
// https://www.deviantart.com/_napi/shared_api/deviation/extended_fetch?deviationid=915871672&username=Chintora0201&type=art&include_session=false
