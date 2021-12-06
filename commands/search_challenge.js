const { SlashCommandBuilder } = require('@discordjs/builders')
const axios = require('../utils/axios')
const { MessageEmbed } = require('discord.js')
const { DateTime } = require('luxon')
const decode = require('html-entities').decode

module.exports = {
  data: new SlashCommandBuilder()
    .setName('searchchallenge')
    .setDescription('Rechercher un challenge')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Nom du challenge')
        .setRequired(true)),

  async execute(interaction) {
    const name = interaction.options.getString('name') // Name

    await interaction.deferReply()

    try {
      const req = await axios.get('/challenges', { params: { titre: name, [new Date().getTime().toString()]: new Date().getTime().toString() } })
      if (req?.data?.length === 2) {
        return await interaction.editReply('Trop de résultats, sois plus précis stp !')
      } else if (Object.keys((req?.data?.[0] || {})).length) {
        const embed = new MessageEmbed().setTitle('Challenges trouvés !')
        for (const challNb of Object.keys(req.data[0])) {
          embed.addField(decode(req.data[0][challNb].titre) + ' (' + req.data[0][challNb].id_challenge + ')', DateTime.fromSQL(req.data[0][challNb].date_publication).setLocale('fr').toLocaleString(DateTime.DATETIME_MED))
        }
        return await interaction.editReply({ embeds: [embed] })
      } else return await interaction.editReply({ content: ':no_entry_sign: Aucun résultat (ou problème serveur)', ephemeral: true })
    } catch (err) {
      return await interaction.editReply({ content: ':no_entry_sign: Aucun résultat (ou problème serveur)', ephemeral: true })
    }
  }
}

