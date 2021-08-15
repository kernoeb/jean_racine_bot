const { SlashCommandBuilder } = require('@discordjs/builders')
const mongoose = require('../utils/mongoose')
const axios = require('axios')
const logger = require('../utils/signale')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('adduser')
    .setDescription('Ajouter un utilisateur (id)')
    .addStringOption(option =>
      option.setName('id')
        .setDescription('Identifiant de l\'utilisateur')
        .setRequired(true)),

  async execute(interaction) {
    const channel = await mongoose.models.channels.findOne({ channelId: interaction.channelId, guildId: interaction.guildId })

    if (!channel)
      return await interaction.reply({ content: ':no_entry_sign: Pas la permission dans ce canal ! (**/init**)', ephemeral: true })

    let req
    const id = interaction.options.getString('id') // ID
    let user = await mongoose.models.user.findOne({ id_auteur: id })
    if (!user) {
      try {
        req = await axios.get(`${process.env.ROOTME_API_URL}/auteurs/${id}?fakehash=${new Date().getTime()}`, { headers: { Cookie: `api_key=${process.env.API_KEY}` } })
        req.data.timestamp = new Date()
        await mongoose.models.user.create(req.data)
        user = await mongoose.models.user.findOne({ id_auteur: id })
      } catch (err) {
        logger.error(err)
        return await interaction.reply({ content: ':no_entry_sign: Utilisateur inexistant !', ephemeral: true })
      }
    }

    if (!(channel.users || []).includes(user.id_auteur)) {
      channel.users.push(user.id_auteur)
      await channel.save()
      return await interaction.reply(`:white_check_mark: Utilisateur ${user.nom} (${user.id_auteur}) ajouté avec succès`)
    } else {
      return await interaction.reply({ content: ':no_entry_sign: Utilisateur déjà présent ici !', ephemeral: true })
    }
  }
}

