const { SlashCommandBuilder } = require('@discordjs/builders')
const { curly } = require('node-libcurl')
const { MessageEmbed } = require('discord.js')
const logger = require('../utils/signale')


module.exports = {
  data: new SlashCommandBuilder()
    .setName('pickctf')
    .setDescription('Choose a CTF from CTF time and create a pool to see who is interested in it')
    .addIntegerOption(option => option.setName('id').setDescription('the id of the CTF').setRequired(true)),
  async execute(interaction) {
    // Checking for the permission
    const id = interaction.options.getInteger('id')
    if(!id) {
      return interaction.reply('Please specify a CTF id')
    }
    await interaction.deferReply()
    let response = await curly.get(`https://ctftime.org/api/v1/events/${id}/`)
    if(response.statusCode == 200) {
      response = response.data
    } else{
      logger.error('Error while fetching the CTF')
      return interaction.editReply({ content: 'Error while fetching the CTF', ephemeral: true })
    }
    const body = response
    // Prepares the message
    const start = body.start.split('T')
    const end = body.finish.split('T')
    const embed = new MessageEmbed()
      .setTitle('Poll for the next CTF')
      .setDescription(body.title, `${body.description}`)
      .setColor('#36393f')
      .addField(
        ':information_source: Infos',
        `**Starts on :** ${start[0]}, at : ${start[1]} \n
                **Host by :** ${body.organizers.name} \n
                **Ends :** ${end[0]}, at : ${end[1]} \n
                **Website :** ${body.url} \n
                **CTF Time URL :** ${body.ctftime_url} \n
                **IRL CTF ? :** ${body.onsite} \n
                **Format :** ${body.format} \n 
                **Duration :** ${body.duration.hours} Heures & ${body.duration.days} Jours \n 
                **Number of Teams Interested :** ${body.participants} \n
                **Weight** ${body.weight} \n
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
          .setTitle('Results of the poll')
          .setDescription('The poll has ended, the results are :')
          .addField('Stats : ', `✅ : ${100 * count[0] / nbVote}% \n ❌ : ${100 * count[1] / nbVote}% \n Number of votes : ${nbVote}`)
          .setThumbnail(body.logo)
        await interaction.followUp({ embeds: [resultEmbed] })
      })
    }
    // Timer for the vote
    setTimeout(vote, 24 * 60 * 60 * 1000)
  }
}