const { SlashCommandBuilder } = require('@discordjs/builders')
const mongoose = require('../utils/mongoose')
const logger = require('../utils/signale')

async function cleanUser(id) {
  try {
    if (await mongoose.models.channels.countDocuments({ users: id }) === 0)
      await mongoose.models.user.deleteOne({ id_auteur: id }) // Completely remove user if used nowhere
  } catch (err) {
    logger.error('Cannot completely remove user ' + id)
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deluser')
    .setDescription('Supprimer un utilisateur (id)')
    .addStringOption(option =>
      option.setName('id')
        .setDescription('Identifiant de l\'utilisateur')
        .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply()

    const guild = await mongoose.models.channels.findOne({ guildId: interaction.guildId })

    if (!guild)
      return await interaction.editReply({ content: ':no_entry_sign: Pas la permission dans ce discord ! (**/init**)', ephemeral: true })
    const id = interaction.options.getString('id') // ID

    if ((guild.users || []).includes(id)) {
      guild.users = (guild.users || []).filter(v => v !== id)
      await guild.save()
      await cleanUser(id)
      return await interaction.editReply(`:white_check_mark: Utilisateur ${id} supprimé avec succès`)
    } else {
      await cleanUser(id)
      return await interaction.editReply({ content: ':no_entry_sign: Utilisateur non présent ici !', ephemeral: true })
    }
  }
}

