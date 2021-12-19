const { SlashCommandBuilder } = require('@discordjs/builders')
const mongoose = require('../utils/mongoose')
const { challengeEmbed } = require('../utils/challenge')
const { validUsers: getValidUsers } = require('../utils/user')
const { DateTime } = require('luxon')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('challenge')
    .setDescription('Informations sur un challenge')
    .addStringOption(option =>
      option.setName('id_or_name')
        .setDescription('Identifiant ou nom du challenge')
        .setRequired(true)),

  async execute(interaction) {
    let option = interaction.options.getString('id_or_name') || interaction.options.getString('id') // ID
    option = option.trim()
    let u = undefined

    if (/^\d+$/.test(option)) {
      const tmpChall = await mongoose.models.challenge.findOne({ id_challenge: option }) // Find if backed up
      if (tmpChall) u = tmpChall.challengeInfo()
      else return await interaction.reply({ content: '*Challenge inexistant ou erreur côté serveur, désolé !*', ephemeral: true })
    } else {
      const chall = await mongoose.models.challenge.find({ titre: new RegExp(option, 'i') })
      if (!chall || (chall && !chall.length)) return await interaction.reply({ content: '*Aucun challenge trouvé, désolé ! Soit plus précis p\'têt.. ou donne son identifiant* : `/searchchallenge`', ephemeral: true })
      if (chall.length !== 1) return await interaction.reply({ content: '*Trop de challenges trouvés... soit plus précis, ou donne son identifiant* : `/searchchallenge`', ephemeral: true })
      u = chall[0].challengeInfo()
      if (u && !!Object.keys(u).length) option = u.id.toString()
    }

    if (u && !!Object.keys(u).length) {
      const validUsers = await getValidUsers({ challId: option, guildId: interaction.guildId })
      return await interaction.reply({ embeds: [challengeEmbed(u, false, validUsers && validUsers.length ? validUsers : null)] })
    } else {
      return await interaction.reply({ content: '*Challenge indisponible ou erreur côté serveur, désolé !*', ephemeral: true })
    }
  }
}
