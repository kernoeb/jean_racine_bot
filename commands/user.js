const { SlashCommandBuilder } = require('@discordjs/builders')
const mongoose = require('../utils/mongoose')
const { MessageEmbed } = require('discord.js')
const axios = require('../utils/axios')
const { userInfo } = require('../utils/user')
const { getProfilePicture } = require('../utils/get_profile_picture')

const DELETE_TIME = 5000

module.exports = {
  data: new SlashCommandBuilder()
    .setName('user')
    .setDescription('Informations sur un utilisateur')
    .addStringOption(option =>
      option.setName('id_or_name')
        .setDescription('Identifiant de l\'utilisateur')
        .setRequired(true)),

  async execute(interaction) {
    const option = interaction.options.getString('id_or_name') || interaction.options.getString('id') // ID
    let req = undefined
    let u = undefined

    await interaction.deferReply()

    if (/^\d+$/.test(option.trim())) {
      const tmpUser = await mongoose.models.user.findOne({ id_auteur: option }) // Find if backed up

      if (tmpUser) {
        u = tmpUser.userInfo() // Get user info
      } else {
        try {
          req = await axios.get(`/auteurs/${option}`, { params: { fakeHash: new Date().getTime() } })
          u = userInfo(req.data) // Get user info
        } catch (err) {
          setTimeout(() => {
            interaction.deleteReply().then(() => {}).catch(() => {})
          }, DELETE_TIME)
          if (err.code === 'ECONNRESET' || err.code === 'ECONNABORTED') return await interaction.editReply({ content: '*Root-me m\'a temporairement banni (ou est down)... attend 5 minutes, merci bg !*' })
        }
      }
    } else {
      const tmpUser = await mongoose.models.user.findOne({ nom: new RegExp('^' + option + '$', 'i') }) // Find if backed up
      if (tmpUser) {
        u = tmpUser.userInfo() // Get user info
      } else {
        try {
          req = await axios.get('/auteurs', { params: { nom: option, fakeHash: new Date().getTime() } })
          if (Object.keys((req?.data?.[0] || {})).length === 0) {
            setTimeout(() => {
              interaction.deleteReply().then(() => {}).catch(() => {})
            }, DELETE_TIME)
            return await interaction.editReply({ content: 'Aucun utilisateur trouvé bg, désolé !' })
          } else if (Object.keys((req?.data?.[0] || {})).length > 1) {
            setTimeout(() => {
              interaction.deleteReply().then(() => {}).catch(() => {})
            }, DELETE_TIME)
            return await interaction.editReply({ content: 'Trop d\'utilisateurs portent ce nom, soit plus précis stp.. ou donne son identifiant : /searchuser' })
          }
          if (req.data?.[0]?.['0']?.id_auteur) {
            req = await axios.get(`/auteurs/${req.data[0]['0'].id_auteur}`)
            if (req.data) u = userInfo(req.data) // Get user info
          }
        } catch (err) {
          setTimeout(() => {
            interaction.deleteReply().then(() => {}).catch(() => {})
          }, DELETE_TIME)
          if (err.code === 'ECONNRESET' || err.code === 'ECONNABORTED') return await interaction.editReply({ content: '*Root-me m\'a temporairement banni (ou est down)... attend 5 minutes, merci bg !*' })
        }
      }
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

      return await interaction.editReply({ embeds: [embed] })
    } else {
      setTimeout(() => {
        interaction.deleteReply().then(() => {}).catch(() => {})
      }, DELETE_TIME)
      return await interaction.editReply('*Utilisateur inexistant' + ((req === undefined ? ' ou serveur indisponible (ou trop lent mdr)' : '') + '*'))
    }
  }
}
