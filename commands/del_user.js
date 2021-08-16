const { SlashCommandBuilder } = require('@discordjs/builders')
const mongoose = require('../utils/mongoose')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deluser')
    .setDescription('Supprimer un utilisateur (id)')
    .addStringOption(option =>
      option.setName('id')
        .setDescription('Identifiant de l\'utilisateur')
        .setRequired(true)),

  async execute(interaction) {
    const channel = await mongoose.models.channels.findOne({ guildId: interaction.guildId })

    if (!channel)
      return await interaction.reply({ content: ':no_entry_sign: Pas la permission dans ce canal ! (**/init**)', ephemeral: true })
    const id = interaction.options.getString('id') // ID

    if ((channel.users || []).includes(id)) {
      channel.users = (channel.users || []).filter(v => v !== id)
      await channel.save()
      return await interaction.reply(`:white_check_mark: Utilisateur ${id} supprimé avec succès`)
    } else {
      return await interaction.reply({ content: ':no_entry_sign: Utilisateur non présent ici !', ephemeral: true })
    }
  }
}

