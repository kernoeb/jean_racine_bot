const mongoose = require('../utils/mongoose')
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js')

const LIMIT = 5

module.exports = {
  async getScoreboard(guildId, index = 0) {
    const channel = await mongoose.models.channels.findOne({ guildId })
    index = Number(index)

    if (!channel)
      return { content: ':no_entry_sign: Pas la permission dans ce discord ! (**/init**)', ephemeral: true }

    const tmpUsers = await mongoose.models.user.find({ id_auteur: { $in: (channel.users || []) } }).sort({ score: -1, nom: 1 })
      .limit(LIMIT).skip(index * LIMIT)
    if (tmpUsers && tmpUsers.length) {
      const nb = await mongoose.models.user.countDocuments({ id_auteur: { $in: (channel.users || []) } })
      const embed = new MessageEmbed().setTitle(`Utilisateurs (${(index * LIMIT) + 1}-${LIMIT * (index + 1) - (LIMIT - tmpUsers.length)}/${nb})`)

      const row = new MessageActionRow()
      if (index !== 0) {
        row.addComponents(
          new MessageButton()
            .setCustomId('go_page_' + (index - 1))
            .setStyle('SECONDARY')
            .setEmoji('⬅️')
        )
      }
      if (tmpUsers.length === LIMIT && (LIMIT * (index + 1) - (LIMIT - tmpUsers.length) !== nb)) {
        row.addComponents(
          new MessageButton()
            .setCustomId('go_page_' + (index + 1))
            .setStyle('SECONDARY')
            .setEmoji('➡️')
        )
      }

      for (const user of tmpUsers) {
        const tmpUser = user.userInfo()
        embed.addField(`${tmpUser.name} (${tmpUser.id})`, tmpUser.score.toString() + ' points')
      }
      return { embeds: [embed], components: row?.components?.length ? [row] : [] }
    }
    return ':no_entry_sign: Aucun utilisateur enregistré !'
  }
}
