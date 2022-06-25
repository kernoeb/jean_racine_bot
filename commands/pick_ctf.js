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

    // Add bot reactions
    msg.react('✅').then(() =>
      msg.react('❌').catch(err => logger.error(err))
    ).catch(err => logger.error(err))

    try {
      const schedule = process.env.NODE_ENV === 'production' ? 'in 24 hours' : 'in 5 seconds'
      getAgendaVotes().schedule(schedule, 'UPDATE_EMBED', {
        channelId: msg.channelId,
        messageId: msg.id,
        data: { logo: body.logo, ctftime_url: body.ctftime_url, title: body.title }
      }).catch(err => logger.error(err))
    } catch (err) {
      logger.error(err)
    }
  }
}
