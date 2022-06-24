const { SlashCommandBuilder } = require('@discordjs/builders')
const { curly } = require('node-libcurl')
const { MessageEmbed } = require('discord.js')
const logger = require('../utils/signale')
const { DateTime } = require('luxon')


module.exports = {
  data: new SlashCommandBuilder()
    .setName('nextctf')
    .setDescription('Montre les prochains CTF de la semaine sur CTFTime')
    .addIntegerOption(option => option.setName('numberctf').setDescription('Le nombre de CTF à afficher')),

  async execute(interaction) {
    let nbCtf = interaction.options.getInteger('numberctf')
    // if no arguments has been provided sets it to 1
    if(!nbCtf)
      nbCtf = 1
    // basic sanatize of te argument
    else{
      nbCtf = nbCtf > 5 ? 5 : nbCtf
      nbCtf = nbCtf < 1 ? 1 : nbCtf
    }
    await interaction.reply('Récupération des informations en cours, ...')

    let response = await curly.get(`https://ctftime.org/api/v1/events/?limit=${nbCtf}&start=${interaction.createdTimestamp}&finish=${interaction.createdTimestamp + 604800000}`)
    if(response.statusCode === 200) {
      response = response.data
    } else{
      logger.error('Error : CTFTime might be down')
      return interaction.editReply({ content: 'Erreur CTFTime est peut être down', ephemeral: true })
    }
    const body = response
    if(body === []) {
      const embed = new MessageEmbed()
        .setTitle('Erreur :x:')
        .setColor('RED')
        .addField('Pas de CTF dans les 7 prochains jours :(', 'Veuillez réessayer plus tard')
      await interaction.editReply({ embeds : [embed] })
      return
    }
    nbCtf = nbCtf > body.length ? body.length : nbCtf
    const embedArray = []
    for(let i = 0; i < nbCtf; i++) {
      const embed = new MessageEmbed()
        .setTitle('Prochains CTFs')
        .setColor('#36393f')
      if (body[i].title == '_EVENT CHANGED_' && i < body.length - 1) {
        embed.setDescription(body[i + 1].title + '**Changement d\'infomations**', `${body[i + 1].description}`)
        i++
      } else{
        embed.setDescription(body[i].title, `${body[i].description}`)
      }
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
      embed.addField(
        ':information_source: Infos',
        `**Démarre le :** ${start_time[0]}, à : ${start_time[1]} \n
                **Organisé par :** ${body[i].organizers[0].name} \n
                **Fini le :** ${end[0]}, à : ${end[1]} \n
                **Site Web :** ${body[i].url} \n
                **URL CTFTime :** ${body[i].ctftime_url} \n
                **IRL CTF ? :** ${body[i].onsite} \n
                **Format :** ${body[i].format} \n 
                **Durée :** ${duration} \n 
                **Nombre d'équipes interessée :** ${body[i].participants} \n
                **Poid** ${body[i].weight} \n
                **CTF ID :** ${body[i].id}`
      )
      embed.setThumbnail(body[i].logo)
      embedArray.push(embed)
    }
    await interaction.editReply({ embeds : embedArray })
  }
}