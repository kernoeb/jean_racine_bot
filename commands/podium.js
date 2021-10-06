const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageAttachment } = require('discord.js')
const axios = require('axios')
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

    try {
      const channel = await mongoose.models.channels.findOne({ guildId: interaction.guildId })
      const tmpUsers = await mongoose.models.user.find({ id_auteur: { $in: (channel.users || []) } }).sort({
        score: -1,
        nom: 1
      }).limit(3)

      const [pp1, pp2, pp3] = await Promise.all(tmpUsers.map(user => getProfilePicture(user.id_auteur)))

      const { data } = await axios.post(process.env.API_RENDER || 'http://localhost:11871/api/render', {
        html,
        content: { name1: tmpUsers[0].nom, pp1, name2: tmpUsers[1].nom, pp2, name3: tmpUsers[2].nom, pp3 },
        width: 626,
        height: 352
      }, { responseType: 'arraybuffer' })
      const attachment = new MessageAttachment(Buffer.from(data), 'oui.png')
      await interaction.editReply({ files: [attachment] })
    } catch (err) {
      console.log(err)
      await interaction.editReply({ content: 'Erreur désolé...', ephemeral: true })
    }
  }
}
