const { SlashCommandBuilder } = require('@discordjs/builders')
const mongoose = require('../utils/mongoose')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sync_user')
    .setDescription('Lier un utilisateur et un rôle Discord avec un utilisateur Root-Me')
    .addRoleOption(option => option.setName('role').setDescription('Quel rôle ?').setRequired(true))
    .addUserOption(option => option.setName('discord_user').setDescription('Utilisateur Discord').setRequired(true))
    .addStringOption(option => option.setName('rootme_id').setDescription('Utilisateur Root-Me (id)').setRequired(true))
    .addBooleanOption(option => option.setName('delete').setDescription('Supprimer le lien ?').setRequired(false)),

  async execute(interaction) {
    const role = interaction.options.getRole('role')
    const discordUser = interaction.options.getUser('discord_user')
    const rootmeId = interaction.options.getString('rootme_id')
    const deleteLink = interaction.options.getBoolean('delete') || false

    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      if (discordUser.id !== interaction.user.id) return await interaction.reply({ content: ':no_entry_sign: Vous n\'avez pas la permission d\'utiliser cette commande !', ephemeral: true })
    }

    if (!/^\d+$/.test(rootmeId)) return await interaction.reply({ content: ':no_entry_sign: ID Root-Me invalide' })

    await interaction.deferReply()

    const user = await mongoose.models.syncedusers.findOne({ guildId: interaction.guildId, discordId: discordUser.id, rootmeId, roleId: role.id })

    if (deleteLink) {
      if (user) {
        await mongoose.models.syncedusers.deleteOne({ guildId: interaction.guildId, discordId: discordUser.id, rootmeId, roleId: role.id })
        return await interaction.editReply({ content: ':white_check_mark: Utilisateur supprimé avec succès' })
      } else {
        return await interaction.editReply({ content: ':no_entry_sign: Lien non présent ici !', ephemeral: true })
      }
    }

    if (user) {
      return await interaction.editReply({ content: ':no_entry_sign: Utilisateur déjà lié !' })
    }

    try {
      await mongoose.models.syncedusers.create({ guildId: interaction.guildId, discordId: discordUser.id, rootmeId, roleId: role.id })
      return await interaction.editReply(`:white_check_mark: Utilisateur ${discordUser.tag} lié avec succès`)
    } catch (err) {
      console.log(err)
      return await interaction.editReply({ content: ':no_entry_sign: Erreur lors de la liaison !' })
    }
  }
}
