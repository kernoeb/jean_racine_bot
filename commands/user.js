const { SlashCommandBuilder } = require('@discordjs/builders')
const mongoose = require('../utils/mongoose')
const { MessageEmbed } = require('discord.js')
const axios = require('../utils/axios')
const { userInfo } = require('../utils/user')
const { DateTime } = require('luxon')
const { getProfilePicture } = require('../utils/get_profile_picture')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('user')
    .setDescription('Informations sur un utilisateur')
    .addStringOption(option =>
      option.setName('id')
        .setDescription('Identifiant de l\'utilisateur')
        .setRequired(true)),

  async execute(interaction) {
    const id = interaction.options.getString('id') // ID
    let req = undefined
    let u = undefined

    const tmpUser = await mongoose.models.user.findOne({ id_auteur: id }) // Find if backed up

    if (tmpUser) {
      u = tmpUser.userInfo() // Get user info
    } else {
      req = await axios.get(`/auteurs/${id}`, { params: { fakeHash: new Date().getTime() } })
      u = userInfo(req.data) // Get user info
    }

    if (u && !!Object.keys(u).length) {
      const embed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle(u.name)
        .setDescription(`**ID:** ${u.id}`)

      const thumbnail = await getProfilePicture(u.id)
      if (thumbnail) embed.setThumbnail(thumbnail + `?fakeHash=${new Date().getTime()}`)

      if (u.score != null && u.score !== '') embed.addField('Score', u.score.toString(), true)
      if (u.position != null && u.position !== '') embed.addField('Rang', u.position.toString(), true)
      if (u.position != null && u.position !== '') embed.addField('\u200B', '\u200B', true)
      if (u.validationsLength != null && u.validationsLength !== '') embed.addField('Validations', u.validationsLength.toString(), true)
      if (u.challengesLength != null && u.challengesLength !== '') embed.addField('Challenges', u.challengesLength.toString(), true)
      if (u.solutionsLength != null && u.solutionsLength !== '') embed.addField('Solutions', u.solutionsLength.toString(), true)

      if (u.validationsIds && u.validationsIds.length) {
        embed.addField('\u200B', '\u200B')

        const currentCategories = await mongoose.models.challenge.aggregate([{ '$group': { '_id': '$id_rubrique', 'rubrique': { $first: '$rubrique' }, count:{ '$sum': 1 } } }])
        const challs = await mongoose.models.challenge.find({ id_challenge: { $in: u.validationsIds } }, { id_rubrique: 1 })

        let tmpCount = 0
        for (const category of currentCategories.sort((a, b) => (a.rubrique || '').localeCompare((b.rubrique || '')))) {
          if ((tmpCount + 1) % 2 === 0) embed.addField('\u200B', '\u200B', true)
          embed.addField(category.rubrique, challs.filter(v => v.id_rubrique === category._id).length + '/' + category.count, true)
          tmpCount++
        }
      }

      return await interaction.reply({ embeds: [embed] })
    } else {
      return await interaction.reply('Utilisateur inexistant' + (req === undefined ? ' ou serveur indisponible' : ''))
    }
  }
}
