const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageAttachment } = require('discord.js')
const { curly } = require('node-libcurl')
const logger = require('../utils/signale')
const fs = require('fs')
const path = require('path')
const { getProfilePicture } = require('../utils/get_profile_picture')
const mongoose = require('../utils/mongoose')
const html = fs.readFileSync(path.join(process.cwd(), '/assets/podium.html'), 'utf-8')

// BETA - This command is currently in beta.

/**
 *   html-to-image:
 *     image: ghcr.io/kernoeb/html_to_image:main # this is image is not part of the package
 *     restart: always
 *     stdin_open: true
 *     tty: true
 *     networks:
 *       - rootme
 *     security_opt:
 *       - seccomp:./docker/chrome.json
 */

module.exports = {
  data: new SlashCommandBuilder()
    .setName('podium')
    .setDescription('Podium sous forme d\'image'),
  async execute(interaction) {
    await interaction.deferReply()

    if (process.env.NODE_ENV === 'production' && !process.env.API_PUPPETEER_RENDER) {
      return await interaction.editReply({ content: 'Non activé sur ce serveur !' })
    }

    try {
      const channel = await mongoose.models.channels.findOne({ guildId: interaction.guildId })
      const tmpUsers = await mongoose.models.user.find({ id_auteur: { $in: (channel.users || []) } }).sort({
        score: -1,
        nom: 1
      }).limit(3)

      if (tmpUsers?.length !== 3) return await interaction.editReply({ content: 'Il n\'y a pas assez d\'utilisateurs pour afficher le podium !' })

      logger.info(`Podium: ${tmpUsers.map(v => v.id_auteur).join(', ')}`)
      const def = process.env.ROOTME_URL + '/IMG/logo/auton0.png'
      const pp1 = await getProfilePicture(tmpUsers[0].id_auteur) || def
      const pp2 = await getProfilePicture(tmpUsers[1].id_auteur) || def
      const pp3 = await getProfilePicture(tmpUsers[2].id_auteur) || def

      logger.info('Puppeteer')
      const { data } = await curly.post(process.env.NODE_ENV === 'production' ? process.env.API_PUPPETEER_RENDER : 'http://localhost:11871/api/render', {
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
      await interaction.editReply({ content: 'Erreur lors de la génération de l\'image !' })
    }
  }
}
