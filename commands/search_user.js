const { SlashCommandBuilder } = require('@discordjs/builders')
const axios = require('../utils/axios')
const { MessageEmbed } = require('discord.js')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('searchuser')
    .setDescription('Rechercher un utilisateur')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Nom d\'utilisateur')
        .setRequired(true)),

  async execute(interaction) {
    const name = interaction.options.getString('name') // Name

    await interaction.deferReply()

    try {
      const req = await axios.get('/auteurs', { params: { nom: name } })
      if (req?.data?.length === 2) {
        return await interaction.editReply('Trop de résultats, sois plus précis stp !')
      } else if (Object.keys((req?.data?.[0] || {})).length) {
        const embed = new MessageEmbed().setTitle('IDs Utilisateurs')
        for (const userNb of Object.keys(req.data[0])) {
          embed.addField(req.data[0][userNb].nom, req.data[0][userNb].id_auteur, true)
        }
        return await interaction.editReply({ embeds: [embed] })
      } else return await interaction.editReply({ content: ':no_entry_sign: Aucun résultat (ou problème serveur)', ephemeral: true })
    } catch (err) {
      return await interaction.editReply({ content: ':no_entry_sign: Aucun résultat (ou problème serveur)', ephemeral: true })
    }
  }
}

