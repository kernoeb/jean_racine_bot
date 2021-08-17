const { SlashCommandBuilder } = require('@discordjs/builders')
const mongoose = require('../utils/mongoose')
const axios = require('../utils/axios')()
const { challengeInfo, challengeEmbed } = require('../utils/challenge')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('challenge')
    .setDescription('Informations sur un challenge')
    .addStringOption(option =>
      option.setName('id')
        .setDescription('Identifiant du challenge')
        .setRequired(true)),

  async execute(interaction) {
    const id = interaction.options.getString('id') // ID
    let req = undefined
    let u = undefined

    try {
      req = await axios.get(`/challenges/${id}`, { params: { fakehash: new Date().getTime() } })
      req.data.id_challenge = id
      u = challengeInfo(req.data) // Get user info
    } catch (err) {
      if (err && err.response && err.response.status === 404) return await interaction.reply({ content: 'Challenge inexistant', ephemeral: true })

      const tmpUser = await mongoose.models.challenge.findOne({ id_challenge: id }) // Find if backed up
      if (tmpUser) {
        u = tmpUser.challengeInfo() // Get user info
        u.backup = true
      }
    }

    if (u && !!Object.keys(u).length) {
      return await interaction.reply({ embeds: [challengeEmbed(u)] })
    } else {
      return await interaction.reply('Challenge inexistant' + (req === undefined ? ' ou serveur indisponible' : ''))
    }
  }
}
