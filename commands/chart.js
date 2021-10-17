const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageAttachment } = require('discord.js')
const { getMonthChart } = require('../utils/charts')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chart')
    .setDescription('Vive le tennis de table :ping_pong:')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type de graphique')
        .setRequired(true)),
  async execute(interaction) {
    const attachment = new MessageAttachment(await getMonthChart(interaction.guildId), `month-${interaction.guildId}.png`)
    await interaction.reply({ files: [attachment] })
  }
}
