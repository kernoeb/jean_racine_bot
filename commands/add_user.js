const { SlashCommandBuilder } = require('@discordjs/builders')
const mongoose = require('../utils/mongoose')
const curl = require('../utils/curl')
const logger = require('../utils/signale')
const { updateScoreboards } = require('../utils/scoreboard')

const DELETE_TIME = 5000

module.exports = {
  data: new SlashCommandBuilder()
    .setName('adduser')
    .setDescription('Ajouter un utilisateur (id)')
    .addStringOption(option =>
      option.setName('id')
        .setDescription('Identifiant de l\'utilisateur')
        .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply()

    const guild = await mongoose.models.channels.findOne({ guildId: interaction.guildId })

    if (!guild) {
      setTimeout(() => {
        interaction.deleteReply().then(() => {}).catch(() => {})
      }, DELETE_TIME)
      return await interaction.editReply({
        content: ':no_entry_sign: Pas la permission dans ce discord ! (**/init**)'
      })
    }

    let req
    const id = interaction.options.getString('id') // ID
    let user = await mongoose.models.user.findOne({ id_auteur: id })
    if (!user) {
      try {
        req = await curl.get(`/auteurs/${id}`)
        req.data.timestamp = new Date()
        await mongoose.models.user.create(req.data)
        user = await mongoose.models.user.findOne({ id_auteur: id })
      } catch (err) {
        logger.error(err)
        setTimeout(() => {
          interaction.deleteReply().then(() => {}).catch(() => {})
        }, DELETE_TIME)
        // TODO better error handling
        // if (err.code === 'ECONNRESET' || err.code === 'ECONNABORTED') return await interaction.editReply({ content: '*Root-me m\'a temporairement banni (ou est down)... attend 5 minutes, merci bg !*' })
        return await interaction.editReply({ content: ':no_entry_sign: Utilisateur inexistant !' })
      }
    }

    if (!(guild.users || []).includes(user.id_auteur)) {
      guild.users.push(user.id_auteur)
      await guild.save()

      updateScoreboards().catch(() => {
        logger.error('Error while updating scoreboards')
      })

      return await interaction.editReply(`:white_check_mark: Utilisateur ${user.nom} (${user.id_auteur}) ajouté avec succès`)
    } else {
      setTimeout(() => {
        interaction.deleteReply().then(() => {}).catch(() => {})
      }, DELETE_TIME)
      return await interaction.editReply({ content: ':no_entry_sign: Utilisateur déjà présent ici !' })
    }
  }
}
