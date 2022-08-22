const mongoose = require('../utils/mongoose')
const curl = require('./curl')
const logger = require('../utils/signale')
const { challengeEmbed, challengeInfo, getNumberOfValidations } = require('../utils/challenge')
const { updateScoreboards } = require('../utils/scoreboard')
const client = require('../utils/discord')()
const decode = require('html-entities').decode
const { pause } = require('../utils/util')
const { MessageAttachment, MessageEmbed } = require('discord.js')
const getCanvas = require('../utils/canvas')
const { validUsers } = require('./user')
const { DateTime } = require('luxon')
const { getCategory } = require('./challenge')

const customProxy = process.env.NODE_ENV === 'production' ? (process.env.PROXY_CHALL || 'tor-node-chall:9050') : '127.0.0.1:9054'

const sumByCategory = async (arr, category) => {
  const challs = []
  for (const item of arr || []) {
    if (Number(item.id_rubrique) === Number(category)) {
      challs.push(Number(item.id_challenge))
    }
  }
  if (challs.length === 0) return 0
  const agg = await mongoose.models.challenge.aggregate([{ $match: { id_challenge: { $in: challs } } }, { $group: { _id : null, sum : { $sum: '$score' } } }])
  return agg?.length ? agg[0].sum : 0
}

module.exports = {
  fetchChallenge: async function(id_challenge, channelIds) {
    let ret
    const f = await mongoose.models.challenge.findOne({ id_challenge })
    await pause(1000)
    let reqPage
    try {
      reqPage = await curl.get(`/challenges/${id_challenge}`, { customProxy, bypassCache: true })
    } catch (err) {
      await pause(1000)
      if (err.code === 403) {
        logger.info('403, wait 9 seconds and retrying later...')
        await pause(9000)
        return // rip
      }
      if (err.code === 401 && process.env.API_KEY) {
        logger.error(`Premium challenge : ${id_challenge}`)
        try {
          logger.info('Petite pause de 10 secondes parce que l\'api est reloue')
          await pause(9000)
          reqPage = await curl.get(`/challenges/${id_challenge}`, { headers: { cookie: `api_key=${process.env.API_KEY}` }, customProxy, bypassCache: true })
        } catch (err) {
          logger.error(err)
        }
      } else logger.error(err)
    }
    if (reqPage?.data?.titre) reqPage.data = [reqPage.data]
    if (reqPage?.data?.[0] && reqPage?.data?.[0]?.['error'] == null) {
      reqPage.data = reqPage.data[0]
      reqPage.data.timestamp = new Date()
      if (reqPage.data.titre) reqPage.data.titre = decode(reqPage.data.titre).replace('’', '\'')
      if (reqPage.data.soustitre) reqPage.data.soustitre = decode(reqPage.data.soustitre).replace('’', '\'')

      try {
        delete reqPage.data.validations
      } catch (err) {}

      const nbOfValidations = await getNumberOfValidations(id_challenge)
      if (nbOfValidations != null) reqPage.data.validations = nbOfValidations || 0

      try {
        reqPage.data.auteurs = Object.keys(reqPage.data.auteurs).map(v => reqPage.data.auteurs[v])
      } catch (err) {
        reqPage.data.auteurs = []
      }

      if (f) {
        ret = await mongoose.models.challenge.updateOne({ id_challenge }, reqPage.data)
      } else {
        reqPage.data.id_challenge = id_challenge
        ret = await mongoose.models.challenge.create(reqPage.data)

        if (client && channelIds) {
          for (const channel of channelIds) await client.channels.cache.get(channel).send({ embeds: [challengeEmbed(challengeInfo(reqPage.data), true)] })
        }
      }
      logger.log(id_challenge + ' > ' + (reqPage?.data?.titre || 'Titre inconnu') + (ret.nModified || ret._id ? '*' : ''))
      await pause(1000)
    } else {
      logger.error('Failed while loading challenge')
    }
  },
  fetchChallenges: async function(channelIds) {
    logger.info('Fetch and update challenges')
    let fetchContinue = true
    let index = 0
    while (fetchContinue) {
      const req = await curl.get('/challenges', { params: { debut_challenges: index * 50 } })

      const page = Object.keys(req.data[0]).map(v => req.data[0][v])
      await pause()

      for (const chall of page) {
        await module.exports.fetchChallenge(chall.id_challenge, channelIds)
      }

      if (req.data?.[1]?.rel !== 'next' && req.data?.[2]?.rel !== 'next') fetchContinue = false
      index++
    }
  },
  updateUsers: async function(channelIds) {
    logger.info('Update users')
    for await (const user of mongoose.models.user.find()) {
      try {
        const req = await curl.get(`/auteurs/${user.id_auteur}`, { bypassCache: true })

        const toCheck = [
          {
            key: 'validations',
            id: 'id_challenge',
            value: 'date',
            title: 'Nouveau challenge validé'
          },
          {
            key: 'solutions',
            id: 'id_solution',
            value: 'url_solution',
            title: 'Nouvelle solution ajoutée'
          },
          {
            key: 'challenges',
            id: 'id_challenge',
            value: 'url_challenge',
            title: 'Nouveau challenge créé'
          }
        ]

        let updateScoreboard = false

        if (client && channelIds) {
          for (const element of toCheck) {
            if (req.data[element.key] && req.data[element.key].length) {
              const oldValues = (user[element.key] || []).map(v => v[element.id])
              const _oldSet = new Set(oldValues)
              const newValues = (req.data[element.key] || []).map(v => v[element.id])
              const newValidationElements = (req.data[element.key] || []).reduce((obj, item) => (obj[item[element.id]] = item[element.value], obj), {})
              const _newSet = new Set(newValues)
              const intersect = [...new Set([..._oldSet].filter(x => _newSet.has(x)))]
              const increased = []

              newValues.forEach((item) => {
                if (intersect.indexOf(item) === -1) increased.push(item)
              })

              if (increased.length) {
                updateScoreboard = true

                const channelsIdsFiltered = (await mongoose.models.channels.find({ users: user.id_auteur })).map(v => ({ channelId: v.channelId, guildId: v.guildId }))
                logger.log(channelsIdsFiltered)

                for (const channel of channelsIdsFiltered) {
                  let lastScore = user.score || 0
                  for (const [_, v] of increased.entries()) {
                    let chall = undefined
                    const isChall = element.id === 'id_challenge'

                    if (isChall) chall = await mongoose.models.challenge.findOne({ [element.id]: Number(v) })

                    // Try to fetch the challenge if not found
                    if (!chall && isChall) {
                      try {
                        logger.log(`Challenge ${v} not found, fetching it`)
                        await module.exports.fetchChallenge(Number(v), (await mongoose.models.channels.find({})).map(c => c.channelId))
                        chall = await mongoose.models.challenge.findOne({ [element.id]: Number(v) })
                      } catch (err) {
                        logger.error(err)
                      }
                    }

                    // Increment temporarily the score
                    if (chall && chall.score && element.key === 'validations') lastScore = lastScore + Number(chall.score)

                    const objUser = {
                      username: user.nom,
                      id: user.id_auteur,
                      score: lastScore != null ? lastScore : undefined
                    }

                    const objChallUsers = {}
                    if (isChall && element.key !== 'challenges') {
                      const valid = await validUsers({ challId: v, guildId: channel.guildId })
                      if (valid) {
                        if (valid.length + 1 === 1) objChallUsers.firstBlood = true
                        else objChallUsers.serverRank = valid.length + 1
                      }
                    }

                    const objChall = {
                      title: chall && chall.titre ? decode(chall.titre.toString()) : v.toString(),
                      points: chall && chall.score ? Number(chall.score) : undefined,
                      date: (element.value === 'date' && newValidationElements[v] && DateTime.fromSQL(newValidationElements[v]).setLocale('fr').toLocaleString(DateTime.DATETIME_MED)) || 'Aucune date',
                      category: chall && chall.id_rubrique ? chall.id_rubrique : undefined,
                      validations: isChall ? await getNumberOfValidations(v) : undefined
                    }

                    // Send Discord message in channel
                    try {
                      const attachment = new MessageAttachment((await getCanvas({ typeText: element.title, channel: {}, user: objUser, challUsers: objChallUsers, chall: objChall })).toBuffer(), new Date().toISOString() + '-profile-image.png')
                      const toSend = { files: [attachment] }
                      if (isChall && chall && chall.titre && chall.url_challenge) {
                        toSend.embeds = [
                          new MessageEmbed()
                            .setTitle(decode((chall.titre || '').toString()))
                            .setURL(`${process.env.ROOTME_URL}/${chall.url_challenge}`)
                          // .setDescription(`${process.env.ROOTME_URL}/${userUrl}`)
                        ]
                      }
                      await client.channels.cache.get(channel.channelId).send(toSend)
                    } catch (err) {
                      logger.error(err)
                    }
                  }
                }
              }
            }
          }
        }

        const categories = getCategory(null, true)
        for (const categoryKey of Object.keys(categories)) {
          req.data['score_' + categoryKey] = await sumByCategory(req.data.validations, categoryKey)
        }

        req.data.timestamp = new Date()
        const update = await mongoose.models.user.updateOne({ id_auteur: req.data.id_auteur }, req.data, { runValidators: true }) // Update user in database

        if (updateScoreboard) {
          updateScoreboards().catch(() => {
            logger.error('Error while updating scoreboards')
          })
        }

        await pause()
        logger.success('User', user.id_auteur, update)
      } catch (err) {
        await pause(3000)
        if (err?.code === 28) logger.error('Root-Me is slow, timeout was reached...')
        else logger.error(err)
      }
    }
  }
}
