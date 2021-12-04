const { SlashCommandBuilder } = require('@discordjs/builders')
const Parser = require('rss-parser')
const { MessageEmbed } = require('discord.js')
const parser = new Parser()
const { DateTime } = require('luxon')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('getlastchallenges')
    .setDescription('Voir les derniers challenges sortis'),
  async execute(interaction) {
    await interaction.deferReply()

    try {
      const feed = await parser.parseURL(`${process.env.ROOTME_URL}/?page=backend&id_rubrique=5`)

      const embed = new MessageEmbed().setColor('#0099ff').setTitle('Derniers challenges').setImage('https://cdn-images-1.medium.com/1*joz9hfPQ-osvbLiUqfakmg.png')

      feed.items.forEach(item => {
        embed.addField((item.title || '').trim(),
          `${(item.creator || '').split(',').map(v => v.trim()).join(', ')} - ${DateTime.fromISO(item.date).setLocale('fr').toLocaleString(DateTime.DATETIME_MED)}\n[Lien du challenge](${item.link})`)
      })

      return await interaction.editReply({ embeds: [embed] })
    } catch (err) {
      console.log(err)
      return await interaction.editReply('Oups ! ça marche pas. Sûrement la faute à Root-Me.')
    }
  }
}
