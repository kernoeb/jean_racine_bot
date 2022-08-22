const Parser = require('rss-parser')
const parser = new Parser()
const logger = require('./signale')
const mongoose = require('../utils/mongoose')
const curl = require('./curl')
const jsdom = require('jsdom')
const { fetchChallenge } = require('./updates')
const { JSDOM } = jsdom

const hostname = process.env.ROOTME_URL.replace(/https?:\/\//, '')

module.exports = {
  getLastChallenges: async function() {
    const randomString = ''// Math.random().toString(36).replace(/[^a-z]+/g, '').slice(0, 5)
    const feed = await parser.parseURL(`${process.env.ROOTME_URL}/?page=backend&var_mode=calcul&id_rubrique=5${randomString}`)

    const channelIds = (await mongoose.models.channels.find({})).map(c => c.channelId)

    for (const item of feed.items) {
      try {
        const url_challenge = item.link.split(process.env.ROOTME_URL)[1].slice(1)
        const tmp = await mongoose.models.challenge.findOne({ url_challenge })
        if (tmp) {
          logger.info(`Challenge ${url_challenge} already exists`)
          continue
        }
        const { data } = await curl.get('/' + url_challenge, { customHostname: hostname })
        const dom = new JSDOM(data)
        const id = dom.window.document.querySelector('[class^="crayon challenge-titre"]').className.split('challenge-titre-')[1].trim()
        await fetchChallenge(Number(id), channelIds)
      } catch (err) {
        logger.error(err)
      }
    }
  }
}
