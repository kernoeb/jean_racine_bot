const { SlashCommandBuilder } = require('@discordjs/builders')
const { getScoreboard } = require('../utils/get_scoreboard')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('scoreboard')
    .setDescription('Tableau des scores'),
  async execute(interaction) {
    await interaction.reply(await getScoreboard(interaction.guildId))
  }
}

