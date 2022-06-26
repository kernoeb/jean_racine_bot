const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageAttachment } = require('discord.js')
const { curly } = require('node-libcurl')
const logger = require('../utils/signale')
const fs = require('fs')
const path = require('path')
const { getProfilePicture } = require('../utils/get_profile_picture')
const mongoose = require('../utils/mongoose')
const html = fs.readFileSync(path.join(process.cwd(), '/assets/podium.html'), 'utf-8')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('podium')
    .setDescription('Podium sous forme d\'image'),
  async execute(interaction) {
    await interaction.deferReply()
    // return await interaction.editReply({ content: 'Commande en maintenance, elle revient plus tard !' })

    try {
      const channel = await mongoose.models.channels.findOne({ guildId: interaction.guildId })
      const tmpUsers = await mongoose.models.user.find({ id_auteur: { $in: (channel.users || []) } }).sort({
        score: -1,
        nom: 1
      }).limit(3)

      logger.info(`Podium: ${tmpUsers.map(v => v.id_auteur).join(', ')}`)
      const def = process.env.ROOTME_URL + '/IMG/logo/auton0.png'
      const pp1 = await getProfilePicture(tmpUsers[0].id_auteur) || def
      const pp2 = await getProfilePicture(tmpUsers[1].id_auteur) || def
      const pp3 = await getProfilePicture(tmpUsers[2].id_auteur) || def

      logger.info('Puppeteer')
      const { data } = await curly.post(process.env.API_RENDER || 'http://localhost:11871/api/render', {
        postFields: JSON.stringify({
          html,
          content: { name1: tmpUsers[0].nom, pp1, name2: tmpUsers[1].nom, pp2, name3: tmpUsers[2].nom, pp3 },
          width: 626,
          height: 352
        }),
        httpHeader: [
          'Content-Type: application/json',
          'Accept: image/png'
        ]
      })
      const attachment = new MessageAttachment(Buffer.from(data), 'oui.png')
      await interaction.editReply({ files: [attachment] })
    } catch (err) {
      logger.error(err)
      await interaction.editReply({ content: 'Erreur désolé...', ephemeral: true })
    }
  }
}
