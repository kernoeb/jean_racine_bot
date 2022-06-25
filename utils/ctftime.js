const mongoose = require('./mongoose')
const Agenda = require('agenda')
const logger = require('./signale')
const agenda = new Agenda()
const { MessageEmbed } = require('discord.js')

const reactionArray = ['✅', '❌']

module.exports = {
  // Fetch the message to get the result
  vote: async (channelId, messageId, logo) => {
    const client = require('../utils/discord')()
    if (!client) return

    const message = await client.channels.cache.get(channelId).messages.fetch(messageId)
    if (!message) return logger.error(`Could not fetch message ${messageId}`)

    // Update the message
    await message.fetch()

    const count = []
    for (let i = 0; i < reactionArray.length; i++) count[i] = message.reactions.cache.get(reactionArray[i]).count - 1 // Removes the bot vote*
    const nbVote = count[0] + count[1]

    const resultEmbed = new MessageEmbed()
      .setTitle('Résultat du vote')
      .setDescription('Fin du vote, les résultats sont :')
      .addField('Stats : ', `✅ : ${(100 * count[0] / nbVote) || 0}% \n ❌ : ${(100 * count[1] / nbVote) || 0}% \n Nombre de votes : ${nbVote}`)
      .setThumbnail(logo)

    await message.edit({ embeds: [resultEmbed] })
  },
  getAgenda: (db) => {
    if (!db) return agenda
    agenda.mongo(mongoose.connection.db, 'votes')

    agenda.define('UPDATE_EMBED', {}, async (job) => {
      try {
        const { channelId, messageId, logo } = job.attrs.data
        await module.exports.vote(channelId, messageId, logo)
      } catch (err) {
        logger.error(err)
      }
    })

    return agenda
  },
  formattedEmbed: (body, start_time, end, duration) => {
    return `**Démarre le :** ${start_time[0]}, à ${start_time[1]} \n` +
                `**Organisé par :** ${body.organizers?.[0]?.name || '?'} \n` +
                `**Termine le :** ${end[0]}, à ${end[1]} \n` +
                `**Site Web :** ${body.url} \n` +
                `**URL CTFTime :** ${body.ctftime_url} \n` +
                `**IRL :** ${body.onsite ? 'Oui' : 'Non'} \n` +
                `**Format :** ${body.format} \n ` +
                `**Durée :** ${duration} \n ` +
                `**Nombre d'équipes intéressées :** ${body.participants} \n` +
                `**Poids :** ${body.weight} \n` +
                `**CTF ID :** ${body.id}`
  }
}
