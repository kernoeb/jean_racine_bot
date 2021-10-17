const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageAttachment } = require('discord.js')
const { getMonthChart } = require('../utils/charts')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chart')
    .setDescription('Un maximum de statistiques.')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type de graphique')
        .setRequired(true)),
  async execute(interaction) {
    await interaction.deferReply()

    const attachment = new MessageAttachment(await getMonthChart(interaction.guildId), `month-${interaction.guildId}.png`)
    await interaction.editReply({ files: [attachment] })
  }
}
