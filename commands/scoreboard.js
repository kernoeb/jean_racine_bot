const { SlashCommandBuilder } = require('@discordjs/builders')
const { getScoreboard } = require('../utils/scoreboard')
const { getCategory } = require('../utils/challenge')

const addChoices = (option) => {
  const categories = getCategory(null, true)
  for (const [key, value] of Object.entries(categories)) {
    option.addChoices({ name: value.title, value: key })
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
        .setRequired(false)))
    .addRoleOption(option => option.setName('role')
      .setDescription('Rôle')
      .setRequired(false)),
  async execute(interaction) {
    const category = interaction.options?.getString('category') || undefined
    let role = interaction.options?.getRole('role') || undefined
    if (role && (role.name === '@everyone' || role.name === '@here')) return await interaction.reply({ content: '*Le rôle everyone ou here n\'est pas autorisé !*', ephemeral: true })

    if (!role || !role.id) role = undefined
    await interaction.reply(await getScoreboard({ guildId: interaction.guildId, category, role }))
  }
}

