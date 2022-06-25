const { SlashCommandBuilder } = require('@discordjs/builders')
const { curly } = require('node-libcurl')
const { MessageEmbed } = require('discord.js')
const logger = require('signale-logger')
const jsdom = require('jsdom')
const { JSDOM } = jsdom

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
      .setTitle('Top 10 global de CTFTime')
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
        embed.addField(request[i].team_name, `Place : ${i + 1}`)
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
    const dom = new JSDOM(response)
    const matches = [...dom.window?.document?.querySelector('tbody')?.textContent?.matchAll(/\d+([a-zA-Z ]+)\d+/g)]
    let counter = 1
    matches.slice(0, 10).forEach(match => {
      embed.addField(match[1], `Place ${counter++}`)
    })
    await interaction.editReply({ embeds : [embed] })
  }
}