const { SlashCommandBuilder } = require('@discordjs/builders')
const { curly } = require('node-libcurl')
const { MessageEmbed } = require('discord.js')
const logger = require('signale-logger')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('topctftime')
    .setDescription('Montre le TOP 10 CTFTime global ou d\'un pays')
    .addStringOption(option => option.setName('locale').setDescription('La locale du pays en question (ex: fr, us, ...)')),
  async execute(interaction) {
    // keep track of the execution to show the right error message if any
    // Get the locale parameter
    let locale = interaction.options.getString('locale')
    // Defer the reply to permit more time to execute the command
    await interaction.deferReply()
    // Checks if the user provided a locale if not shows the general top 10
    if (!locale) {
      let request = await curly.get('https://ctftime.org/api/v1/top/')
      if (request.statusCode === 200) {
        // Get the data
        request = request.data
      } else {
        // If the request was not successful, show the error message
        logger.error('Error while fetching the TOP 10 CTFTime might be down')
        return interaction.editReply({ content: 'Erreur CTFTime est peut être down', ephemeral: true })
      }

      const embed = new MessageEmbed()
        .setTitle('Top 10 global de CTFTime')
        .setThumbnail('https://avatars.githubusercontent.com/u/2167643?s=200&v=4')
        .setURL('https://ctftime.org/')
      request = Object.values(request)[0]
      for (let i = 0; i < request.length; i++) {
        embed.addField(request[i].team_name, `Place : ${i}`)
      }
      return await interaction.editReply({ embeds: [embed] })
    }

    // Prepare the url
    locale = locale.toUpperCase()
    // Scrap the data from the CTFTime website
    let response = await curly.get('https://ctftime.org/stats/' + locale)
    // Check if the request was successful
    if (response.statusCode === 200) {
      // Get the data
      response = response.data
    } else {
      // If the request was not successful, show the error message
      logger.error('Error while fetching the TOP10 make sure that the locale is correct or CTFTime might be down')
      return interaction.editReply({
        content: 'Erreur : CTFTime est peut être down ou la locale est incorrecte',
        ephemeral: true
      })

    }
    // Get the top 10 teams
    const text = response
    const txtparse = text.split('\n')
    const top10 = []
    let i = 0
    for (const string of txtparse) {
      if (string.includes('<tr><td class="place">') && i < 10) {
        let str = ''
        str += string
        top10.push(str.trim())
        i++
      }
    }
    // Get the TOP 10 teams ids
    const ids = []
    for (let j = 0; j < top10.length; j++) {
      for (let k = 0; k < top10[j].length; k++) {
        if (top10[j][k] <= '9' && top10[j][k] >= '0' && top10[j][k - 1] === '/') {
          let id = '' + top10[j][k]
          while (top10[j][k + 1] !== '"') {
            k++
            id += top10[j][k]
          }
          ids.push([id, j + 1])
        }
      }
    }

    // construct the embed
    const msgtop10 = new MessageEmbed()
    msgtop10.setTitle('TOP 10 CTFTime du pays ' + locale)
    msgtop10.setThumbnail('https://avatars.githubusercontent.com/u/2167643?s=200&v=4')
    msgtop10.setURL('https://ctftime.org/')
    interaction.editReply({ embeds: [msgtop10] })
    let x = 0

    function master() {
      // Set an interval to avoid the rate limit
      const inter = setInterval(messageSender, 1500)

      async function messageSender() {
        if (x < 10) {
          const [id, place] = ids[x]
          x++
          // get the team name via the CTF time API
          const resp = await curly.get(`https://ctftime.org/api/v1/teams/${id}/`)
          const json = resp.data
          msgtop10.addField(json.name, 'Place : ' + place)
          await interaction.editReply({ embeds: [msgtop10] })
        } else {
          clearInterval(inter)
        }
      }
    }

    master()
  }
}
