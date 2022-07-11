import axios from 'axios';
import cheerio from 'cheerio';

export const wp_search = (text) => 
    new Promise((resolve, reject) => {
        axios.get(`https://waifuplay.my.id/?s=${text}`)
        .then(async ({ data }) => {
            const $ = cheerio.load(data);
            const list_episode = await wp_list($('.flexbox2-item').find('a').attr('href'))
            resolve({
                title: $('.flexbox2-item').find('a').attr('title'),
                image: $('.flexbox2-item').find('img').attr('src').replace('?resize=225,310','').replace('waifuplay.me',"waifuplay.my.id"),
                score: $('.flexbox2-item').find('.score').text(),
                studio: $('.flexbox2-item').find('.flexbox2-title > span').map((i, el) => $(el).text()).get(1),
                season: $('.flexbox2-item').find('.season').text(),
                type: $('.flexbox2-item').find('.type').text(),
                genre: $('.flexbox2-item').find('.genres').text(),
                link: $('.flexbox2-item').find('a').attr('href').replace('waifuplay.me',"waifuplay.my.id"),
                sysnopsis: $('.flexbox2-item').find('.synops').text(),
                list_episode: list_episode
            })
        })
        .catch(({ response }) => reject({ status: false, response }))
    })


export const wp_list = (url) => 
    new Promise((resolve, reject) => {
        if (url.includes('batch')) {
            axios.get(url)
            .then(({ data }) => {
                const $ = cheerio.load(data)
                const result = []
                $('div#download > ul > li').get().map(res => {
                    result.push({
                        quality: $(res).find('b').text(),
                        url: $(res).find('a').attr('href') 
                    })
                })
                resolve({ type: 'batch', result })
            })
        } else {
            axios.get(url)
            .then(async ({ data }) => {
                const $ = cheerio.load(data)
                const result = []
                $('.series-episodelist > li').get().map(res => {
                    result.push({
                        episode: $(res).find('a > span').map((i, el) => $(el).text()).get(0),
                        url: $(res).find('a').attr('href')
                    })
                })
                resolve({ type: 'episode', result })
            })
            .catch(e => reject(e))
        }
    })


export const wp_download = (url) => 
    new Promise((resolve, reject) => {
        axios.get(url)
        .then(({ data }) => {
            const $ = cheerio.load(data)
            const result = []
            $('.dlbox2 > a').get().map(res => {
                result.push({
                    quality: $(res).text() || '',
                    url: $(res).attr('href') || ''
                })
            })
            resolve(result)
        })
    })



export const wp_latest = () => 
    new Promise((resolve, reject) => {
        axios.get('https://waifuplay.my.id/')
        .then(({ data }) => {
            const $ = cheerio.load(data)
            const results = []
            const flex = $(".flexbox").map((i, element) => $(element).find('.flexbox-item')).get(1)
            $(flex).get().map(res => {
                results.push({
                    title: $(res).find('.flexbox-title').text(),
                    episode: $(res).find('.flexbox-episode').text().replace('Episode', ''),
                    image: $(res).find('img').attr('src').replace('?resize=225,310','').replace('waifuplay.me',"waifuplay.my.id"),
                    status: $(res).find('.flexbox-status').text(),
                    type: $(res).find('.flexbox-type').text(),
                    link: $(res).find('a').attr('href').replace('waifuplay.me',"waifuplay.my.id")
                })
            })
            resolve({results})
        })
        .catch(({ response }) => reject({ status: false, response }))
    })
