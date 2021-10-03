const { SlashCommandBuilder } = require('@discordjs/builders')
const mongoose = require('../utils/mongoose')
const logger = require('../utils/signale')
const { getScoreboard } = require('../utils/scoreboard')


module.exports = {
  data: new SlashCommandBuilder()
    .setName('createglobalscoreboard')
    .setDescription('Ajouter un scoreboard global'),

  async execute(interaction) {
    const { guildId, channelId } = interaction

    const guild = await mongoose.models.channels.findOne({ guildId })

    if (!guild) {
      return await interaction.reply({
        content: ':no_entry_sign: Pas la permission dans ce discord ! (**/init**)',
        ephemeral: true
      })
    }

    await interaction.reply(await getScoreboard({ guildId, limit: 60, globalScoreboard: true }))

    try {
      const message = await interaction.fetchReply()
      guild.scoreboard = { channelId, messageId: message.id }
      await guild.save()
    } catch (err) {
      logger.error(err)
    }
  }
}

