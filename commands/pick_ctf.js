const { SlashCommandBuilder } = require('@discordjs/builders')
const { curly } = require('node-libcurl')
const { MessageEmbed } = require('discord.js')
const logger = require('../utils/signale')
const { DateTime } = require('luxon')


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
    if(response.statusCode === 200) {
      response = response.data
    } else{
      logger.error('Error while fetching the CTF CTFTime might be down')
      return interaction.editReply({ content: 'Erreur CTFtime est down ou L\'ID fournie est incorrect', ephemeral: true })
    }
    const body = response
    // Prepares the message
    const start_time = DateTime.fromISO(body.start).setLocale('fr').toFormat('f').split(', ')
    const end = DateTime.fromISO(body.finish).setLocale('fr').toFormat('f').split(', ')
    let duration = ''
    if(body.duration.days && body.durtation.hours) {
      duration += `${body.duration.days} Jours et ${body.duration.hours} Heures`
    } else if (body.duration.days) {
      duration += `${body.duration.days} Jours`
    } else{
      duration += `${body.duration.hours} Heures`
    }
    const embed = new MessageEmbed()
      .setTitle('Vote Pour le CTF')
      .setDescription(body.title, `${body.description}`)
      .setColor('#36393f')
      .addField(
        ':information_source: Infos',
        `**Démarre le :** ${start_time[0]} à ${start_time[1]} \n
                **Organisé par :** ${body.organizers[0].name} \n
                **Fini le :** ${end[0]}, à ${end[1]} \n
                **Site Web :** ${body.url} \n
                **URL CTFTime :** ${body.ctftime_url} \n
                **IRL CTF ? :** ${body.onsite} \n
                **Format :** ${body.format} \n 
                **Durée :** ${duration} \n 
                **Nombre d'équipes interessée :** ${body.participants} \n
                **Poid** ${body.weight} \n
                **CTF ID :** ${body.id}`
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
        const count = []
        for(let i = 0; i < reactionArray.length; i++) {
          count[i] = message.reactions.cache.get(reactionArray[i]).count - 1 // Removes the bot's vote
        }
        const nbVote = count[0] + count[1]
        const resultEmbed = new MessageEmbed()
          .setTitle('Résultat du vote')
          .setDescription('Fin du vote, les résultats sont :')
          .addField('Stats : ', `✅ : ${100 * count[0] / nbVote}% \n ❌ : ${100 * count[1] / nbVote}% \n Number of votes : ${nbVote}`)
          .setThumbnail(body.logo)
        await interaction.followUp({ embeds: [resultEmbed] })
      })
    }
    // Timer for the vote
    setTimeout(vote, 24 * 60 * 60 * 1000)
  }
}