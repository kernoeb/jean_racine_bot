const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageEmbed } = require('discord.js')
const fs = require('fs')

const commands = []
const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'))

for (const file of commandFiles.filter(v => v !== 'help.js')) {
  const command = require(`./${file}`)
  commands.push(command.data.toJSON())
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Bot commands'),

  async execute(interaction) {
    const embed = new MessageEmbed().setTitle(':wrench: Commandes du bot').setColor('#d950ff')
    embed.setDescription(commands.sort((a, b) => a.name.localeCompare(b.name))
      .map(c => `\`/${c.name} ${c.options && c.options[0] && c.options[0].name ? '<' + c.options[0].name + '>' : ''}\`: ${c.description}`).join('\n'))
    return await interaction.reply({ embeds: [embed] })
  }
}

