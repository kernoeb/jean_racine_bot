const { SlashCommandBuilder } = require('@discordjs/builders')
const { curly } = require('node-libcurl')
const { MessageEmbed } = require('discord.js')
const logger = require('signale-logger')
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const { numberList } = require('../utils/util')

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
    // Declare the embed globally to avoid code redundancy
    const embed = new MessageEmbed()
      .setThumbnail('https://avatars.githubusercontent.com/u/2167643?s=200&v=4')
      .setURL('https://ctftime.org/')
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
      request = Object.values(request)[0]
      for (let i = 0; i < request.length; i++) {
        embed.addField(`${numberList[i + 1]} - **${request[i].team_name}**`, `Points : ${request[i].points}`)
      }
      embed.setTitle('Top 10 global de CTFTime')
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
    const dom = new JSDOM(response)
    const top10Names = []
    const top10Global = []
    let nbTeams = [...dom.window.document.querySelector('body > div.container > table > tbody').childNodes.values()].length / 2 - 1
    if (nbTeams > 10) {
      nbTeams = 10
    }
    for (let i = 0; i < nbTeams; i++) {
      top10Names.push(dom.window.document.querySelector(`body > div.container > table > tbody > tr:nth-child(${i + 2}) > td:nth-child(5) > a`).textContent)
      top10Global.push(dom.window.document.querySelector(`body > div.container > table > tbody > tr:nth-child(${i + 2}) > td:nth-child(1)`).textContent)
    }
    for (let i = 0; i < nbTeams; i++) {
      embed.addField(`${numberList[i + 1]} - ${top10Names[i]}`, `Place globale : **${top10Global[i]}**`)
    }
    embed.setTitle(`Top 10 ${locale} de CTFTime :flag_${locale.toLowerCase()}:`)
    await interaction.editReply({ embeds: [embed] })
  }
}
