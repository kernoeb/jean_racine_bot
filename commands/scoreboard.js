const { SlashCommandBuilder } = require('@discordjs/builders')
const { getScoreboard } = require('../utils/scoreboard')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('scoreboard')
    .setDescription('Tableau des scores'),
  async execute(interaction) {
    await interaction.reply(await getScoreboard({ guildId: interaction.guildId }))
  }
}

