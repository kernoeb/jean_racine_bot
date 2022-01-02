const { SlashCommandBuilder } = require('@discordjs/builders')
const { getScoreboard } = require('../utils/scoreboard')
const { getCategory } = require('../utils/challenge')

const addChoices = (option) => {
  const categories = getCategory(null, true)
  for (const [key, value] of Object.entries(categories)) {
    option.addChoice(value.title, key)
  }
  return option
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('scoreboard')
    .setDescription('Tableau des scores')
    .addStringOption(option =>
      addChoices(option.setName('category')
        .setDescription('Catégorie')
        .setRequired(false))),
  async execute(interaction) {
    const category = interaction.options?.getString('category') || undefined
    await interaction.reply(await getScoreboard({ guildId: interaction.guildId, category: category || undefined }))
  }
}

