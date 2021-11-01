const mongoose = require('../utils/mongoose')
const axios = require('../utils/axios')
const { MessageEmbed } = require('discord.js')
const logger = require('../utils/signale')
const { challengeEmbed, challengeInfo, challengeFormat } = require('../utils/challenge')
const { updateScoreboards } = require('../utils/scoreboard')
const { getProfilePicture } = require('../utils/get_profile_picture')
const client = require('../utils/discord')()
const decode = require('html-entities').decode
const { pause } = require('../utils/util')

module.exports = {
  fetchChallenges: async function(channelIds) {
    logger.info('Fetch and update challenges')
    let fetchContinue = true
    let index = 0
    while (fetchContinue) {
      const req = await axios.get('/challenges', { params: { debut_challenges: index * 50, fakeHash: new Date().getTime() } })

      const page = Object.keys(req.data[0]).map(v => req.data[0][v])
      await pause()

      for (const chall of page) {
        let ret
        const f = await mongoose.models.challenge.findOne({ id_challenge: chall.id_challenge })
        await pause(1000)
        let reqPage
        try {
          reqPage = await axios.get(`/challenges/${chall.id_challenge}`, { params: { fakeHash: new Date().getTime() } })
        } catch (err) {
          await pause()
          if (err.code === 'ECONNRESET' || err.code === 'ECONNABORTED') throw new Error('DOWN_OR_BANNED')
          else if (err?.response?.status === 401 && process.env.API_KEY) {
            logger.error(`Premium challenge : ${chall.id_challenge}`)
            try {
              logger.info('Petite pause de 10 secondes parce que l\'api est reloue')
              await pause(9000)
              reqPage = await axios.get(`/challenges/${chall.id_challenge}`, { headers: { Cookie: `api_key=${process.env.API_KEY}` }, params: { fakeHash: new Date().getTime() } })
            } catch (err) {
              logger.error(err)
            }
          } else logger.error(err)
        }
        if (reqPage && reqPage.data) {
          reqPage.data.timestamp = new Date()

          if (f) {
            ret = await mongoose.models.challenge.updateOne({ id_challenge: chall.id_challenge }, reqPage.data)
          } else {
            reqPage.data.id_challenge = chall.id_challenge
            ret = await mongoose.models.challenge.create(reqPage.data)

            if (client && channelIds) {
              for (const channel of channelIds) await client.channels.cache.get(channel).send({ embeds: [challengeEmbed(challengeInfo(reqPage.data), true)] })
            }
          }
          logger.log(chall.id_challenge + ' > ' + reqPage.data.titre + (ret.nModified || ret._id ? '*' : ''))
          await pause()
        } else {
          logger.error('Failed while loading challenge')
        }
      }

      if (req.data?.[1]?.rel !== 'next' && req.data?.[2]?.rel !== 'next') fetchContinue = false
      index++
    }
  },
  updateUsers: async function(channelIds) {
    logger.info('Update users')
    for await (const user of mongoose.models.user.find()) {
      try {
        const req = await axios.get(`/auteurs/${user.id_auteur}`, { params: { fakeHash: new Date().getTime() } })

        const toCheck = [
          {
            key: 'validations',
            id: 'id_challenge',
            value: 'date',
            title: 'Nouveaux challenges validés par '
          },
          {
            key: 'solutions',
            id: 'id_solution',
            value: 'url_solution',
            title: 'Nouvelles solutions ajoutées par '
          },
          {
            key: 'challenges',
            id: 'id_challenge',
            value: 'url_challenge',
            title: 'Nouveaux challenges créés par '
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

                const embed = new MessageEmbed()
                  .setTitle(element.title + user.nom)

                const thumbnail = await getProfilePicture(user.id_auteur)
                if (thumbnail) embed.setThumbnail(thumbnail + `?fakeHash=${new Date().getTime()}`)

                for (const [i, v] of increased.entries()) {
                  let chall = undefined
                  if (element.value === 'date') chall = await mongoose.models.challenge.findOne({ [element.id]: Number(v) })
                  embed.addField((i + 1) + '. ' + (chall && chall.titre ? `${decode(chall.titre.toString())}${chall.score ? ' (' + chall.score + ')' : ''}` : v.toString()),
                    element.value === 'date'
                      ? challengeFormat(newValidationElements[v], chall || {})
                      : `[Lien direct](${process.env.ROOTME_URL}/${newValidationElements[v].toString()})`
                  )
                }

                const channelsIdsFiltered = (await mongoose.models.channels.find({ users: user.id_auteur })).map(v => v.channelId)
                logger.log(channelsIdsFiltered)

                for (const channel of channelsIdsFiltered) {
                  try {
                    await client.channels.cache.get(channel).send({ embeds: [embed] })
                  } catch (err) {
                    logger.error(err)
                  }
                }
              }
            }
          }
        }

        req.data.timestamp = new Date()
        const update = await mongoose.models.user.updateOne({ id_auteur: req.data.id_auteur }, req.data, { runValidators: true }) // Update user in database

        if (updateScoreboard) {
          updateScoreboards().catch(() => {
            logger.error('Error while updating scoreboards')
          })
        }

        await pause()
        logger.success('User ', update)
      } catch (err) {
        await pause()
        logger.error(err)
        if (err.code === 'ECONNRESET' || err.code === 'ECONNABORTED') throw new Error('DOWN_OR_BANNED')
      }
    }
  }
}
