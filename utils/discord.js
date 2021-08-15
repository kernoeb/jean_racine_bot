const { Client, Intents, Collection } = require('discord.js')
const fs = require('fs')
let client

module.exports = function() {
  if (client) return client

  client = new Client({ intents: [Intents.FLAGS.GUILDS] })
  client.commands = new Collection()

  const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))

  for (const file of commandFiles) {
    const command = require(`../commands/${file}`)
    // set a new item in the Collection
    // with the key as the command name and the value as the exported module
    client.commands.set(command.data.name, command)
  }

  return client
}
