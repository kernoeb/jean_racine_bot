const { SlashCommandBuilder } = require('@discordjs/builders')
const mongoose = require('../utils/mongoose')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('init')
    .setDescription('Initialiser le bot dans ce canal'),

  async execute(interaction) {
    try {
      await mongoose.models.channels.create({ channelId: interaction.channelId, guildId: interaction.guildId })
    } catch (err) {
      if (err.name === 'MongoError' && err.code === 11000) {
        return await interaction.reply({ content: ':no_entry_sign: Canal déjà initialisé. Tu as une mauvaise mémoire je pense :heart:', ephemeral: true })
      }
      return await interaction.reply({ content: ':no_entry_sign: Petit problème serveur, mp @kernoeb#7737', ephemeral: true })
    }
    return await interaction.reply(':white_check_mark: Canal initialisé avec succès ! :tada:\n`/adduser id` pour ajouter un utilisateur !')
  }
}

