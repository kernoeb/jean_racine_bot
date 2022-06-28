const { Client, Intents, Collection } = require('discord.js')
const { REST } = require('@discordjs/rest')
const { Routes } = require('discord-api-types/v9')
const fs = require('fs')
const logger = require('./signale')

let client

const registerSlashCommands = async (commands) => {
  logger.info('Started refreshing application (/) commands.')
  const rest = new REST({ version: '9' }).setToken(process.env.TOKEN)
  await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands })
}

module.exports = function() {
  if (client) return client

  if (!process.env.REGISTER) {
    client = new Client({
      intents: [Intents.FLAGS.GUILDS],
      presence: {
        status: 'online',
        activities: [{
          name: 'Root-me | kernoeb',
          type: 'PLAYING',
          url: 'https://root-me.org'
        }]
      },
      ws: { properties: { $browser: 'Discord iOS' } } }) // Mobile icon

    client.commands = new Collection()

    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))

    const commands = []
    for (const file of commandFiles) {
      const command = require(`../commands/${file}`)
      // set a new item in the Collection
      // with the key as the command name and the value as the exported module
      client.commands.set(command.data.name, command)
      commands.push(command.data.toJSON())
    }

    if (process.env.NODE_ENV === 'production') {
      registerSlashCommands(commands).then(() => {
        logger.success('Successfully reloaded application (/) commands.')
      }).catch(error => {
        logger.error(error)
      })
    } else {
      logger.info('Development mode, skipping slash command registration.')
    }
  }

  return client
}
