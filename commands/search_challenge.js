const { SlashCommandBuilder } = require('@discordjs/builders')
const axios = require('../utils/axios')
const { MessageEmbed } = require('discord.js')
const { DateTime } = require('luxon')

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

    try {
      const req = await axios.get('/challenges', { params: { titre: name, fakeHash: new Date().getTime() } })
      if (req?.data?.length === 2) {
        return await interaction.reply('Trop de résultats, sois plus précis stp !')
      } else if (Object.keys((req?.data?.[0] || {})).length) {
        const embed = new MessageEmbed().setTitle('Challenges trouvés !')
        for (const challNb of Object.keys(req.data[0])) {
          embed.addField(req.data[0][challNb].titre + ' (' + req.data[0][challNb].id_challenge + ')', DateTime.fromSQL(req.data[0][challNb].date_publication).setLocale('fr').toLocaleString(DateTime.DATETIME_MED))
        }
        return await interaction.reply({ embeds: [embed] })
      } else return await interaction.reply({ content: ':no_entry_sign: Aucun résultat (ou problème serveur)', ephemeral: true })
    } catch (err) {
      return await interaction.reply({ content: ':no_entry_sign: Aucun résultat (ou problème serveur)', ephemeral: true })
    }
  }
}

