const mongoose = require('../utils/mongoose')
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js')
const { DateTime } = require('luxon')
const logger = require('../utils/signale')
const client = require('../utils/discord')()
const { pause } = require('../utils/util')

module.exports = {
  async updateScoreboards() {
    logger.info('Updating scoreboards...')

    const channels = await mongoose.models.channels.find({ scoreboard: { $exists: true } }, { scoreboard: 1 })
    const scoreboards = channels.map(c => c.scoreboard)
    logger.info(JSON.stringify(scoreboards))

    for (const s of scoreboards.filter(v => v.messageId && v.channelId)) {
      client.channels.cache.get(s.channelId).messages.fetch(s.messageId).then(async msg => {
        await msg.edit(await module.exports.getScoreboard({ guildId: msg.guildId, limit: 50 }))
        await pause(100)
      }).catch(() => {
        logger.error('Error while updating scoreboard : ' + s.messageId)
      })
    }

    logger.success('Scoreboards updated.')
  },
  async getScoreboard({ guildId, index = 0, limit = 5 }) {

    const channel = await mongoose.models.channels.findOne({ guildId })
    index = Number(index)

    if (!channel)
      return { content: ':no_entry_sign: Pas la permission dans ce discord ! (**/init**)', ephemeral: true }

    const tmpUsers = await mongoose.models.user.find({ id_auteur: { $in: (channel.users || []) } }).sort({ score: -1, nom: 1 })
      .limit(limit).skip(index * limit)
    if (tmpUsers && tmpUsers.length) {
      const nb = await mongoose.models.user.countDocuments({ id_auteur: { $in: (channel.users || []) } })
      const embed = new MessageEmbed().setTitle(`Utilisateurs (${(index * limit) + 1}-${limit * (index + 1) - (limit - tmpUsers.length)}/${nb})`)

      const row = new MessageActionRow()
      if (index !== 0) {
        row.addComponents(
          new MessageButton()
            .setCustomId('go_page_' + (index - 1))
            .setStyle('SECONDARY')
            .setEmoji('⬅️')
        )
      }
      if (tmpUsers.length === limit && (limit * (index + 1) - (limit - tmpUsers.length) !== nb)) {
        row.addComponents(
          new MessageButton()
            .setCustomId('go_page_' + (index + 1))
            .setStyle('SECONDARY')
            .setEmoji('➡️')
        )
      }

      if (limit < 25) {
        for (const user of tmpUsers) {
          const tmpUser = user.userInfo()
          embed.addField(`${tmpUser.name} (${tmpUser.id})`, tmpUser.score.toString() + ' points')
        }
      } else {
        let f = DateTime.now().setLocale('fr').toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS) + '\n\n'
        for (const user of tmpUsers) {
          const tmpUser = user.userInfo()
          if (tmpUser && tmpUser.name && tmpUser.score != null) f += `**${tmpUser.name}**` + '\n' + tmpUser.score.toString() + ' points\n'
        }
        if (f) embed.setDescription(f)
      }
      return { embeds: [embed], components: row?.components?.length ? [row] : [], content: null }
    }
    return ':no_entry_sign: Aucun utilisateur enregistré !'
  }
}
