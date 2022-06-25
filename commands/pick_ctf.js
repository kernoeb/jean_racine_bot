const { SlashCommandBuilder } = require('@discordjs/builders')
const { curly } = require('node-libcurl')
const { MessageEmbed } = require('discord.js')
const logger = require('../utils/signale')
const { DateTime } = require('luxon')
const { formattedEmbed, getAgenda: getAgendaVotes } = require('../utils/ctftime')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pickctf')
    .setDescription('Crée un vote à partir de l\'ID d\'un CTF de CTFTime')
    .addIntegerOption(option => option.setName('id').setDescription('L\'ID du CTF').setRequired(true)),
  async execute(interaction) {
    // Checking for the permission
    const id = interaction.options.getInteger('id')
    await interaction.deferReply()
    let response = await curly.get(`https://ctftime.org/api/v1/events/${id}/`)
    if (response.statusCode === 200) {
      response = response.data
    } else {
      logger.error('Error while fetching the CTF CTFTime might be down')
      return interaction.editReply({
        content: 'Erreur CTFTime est down ou l\'identifiant fourni est incorrect',
        ephemeral: true
      })
    }
    const body = response
    // Prepares the message
    const start_time = DateTime.fromISO(body.start).setLocale('fr').toFormat('f').split(', ')
    const end = DateTime.fromISO(body.finish).setLocale('fr').toFormat('f').split(', ')
    let duration = ''
    if (body.duration.days && body.duration.hours) {
      duration += `${body.duration.days} jours et ${body.duration.hours} heures`
    } else if (body.duration.days) {
      duration += `${body.duration.days} jours`
    } else {
      duration += `${body.duration.hours} heures`
    }
    const embed = new MessageEmbed()
      .setTitle('Vote pour le CTF')
      .setDescription(body.title, `${body.description}`)
      .setColor('#36393f')
      .addField(
        ':information_source: Infos',
        formattedEmbed(body, start_time, end, duration)
      )
      .setThumbnail(body.logo)
    // Sends the message
    await interaction.editReply({ embeds: [embed] })
    // Create the vote
    const msg = await interaction.fetchReply()
    msg.react('✅').then(() => msg.react('❌'))
    const reactionArray = ['✅', '❌']

    // Fetch the message to get the result
    async function vote() {
      interaction.fetchReply().then(async message => {
        try {
          const count = []
          for (let i = 0; i < reactionArray.length; i++) {
            count[i] = message.reactions.cache.get(reactionArray[i]).count - 1 // Removes the bot's vote
          }
          const nbVote = count[0] + count[1]
          const resultEmbed = new MessageEmbed()
            .setTitle('Résultat du vote')
            .setDescription('Fin du vote, les résultats sont :')
            .addField('Stats : ', `✅ : ${(100 * count[0] / nbVote) || 0}% \n ❌ : ${(100 * count[1] / nbVote) || 0}% \n Nombre de votes : ${nbVote}`)
            .setThumbnail(body.logo)
          await interaction.followUp({ embeds: [resultEmbed] })
        } catch (err) {
          // it can happen if the message is deleted or something
          logger.error(err)
        }
      })
    }

    try {
      getAgendaVotes().schedule('in 10 seconds', 'UPDATE_EMBED', { to: 'test' }).then(() => {
        logger.info('Scheduled')
      })
    } catch (err) {
      logger.error(err)
    }

    // Timer for the vote
    // setTimeout(vote, process.env.NODE_ENV === 'production' ? 24 * 60 * 60 * 1000 : 15000) // 1 day in production, 15 seconds in development
  }
}
