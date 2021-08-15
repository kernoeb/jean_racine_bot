const { SlashCommandBuilder } = require('@discordjs/builders')
const { fetchChallenges, updateUsers } = require('../utils/updates')
const mongoose = require('../utils/mongoose')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('forceupdate')
    .setDescription('Forcer la mise à jour'),

  async execute(interaction) {
    if (!await mongoose.models.channels.findOne({ channelId: interaction.channelId, guildId: interaction.guildId }))
      return await interaction.reply({ content: ':no_entry_sign: Pas la permission dans ce canal ! (**/init**)', ephemeral: true })

    updateUsers(interaction.client, [interaction.channelId]).then(() => {
      fetchChallenges(interaction.client, [interaction.channelId])
    })


    await interaction.reply({ content: 'Actualisation démarrée...', ephemeral: true })
  }
}

