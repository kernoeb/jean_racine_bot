const { REST } = require('@discordjs/rest')
const { Routes } = require('discord-api-types/v9')
const dotenv = require('dotenv')
const fs = require('fs')
const logger = require('./utils/signale')

dotenv.config()

process.env.REGISTER = 'true'

const commands = []
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
  const command = require(`./commands/${file}`)
  commands.push(command.data.toJSON())
}

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

(async () => {
  try {
    logger.info('Started refreshing application (/) commands.')

    await rest.put(
      // Routes.applicationGuildCommands(process.env.CLIENT_ID, 'XXXXX'),
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    )

    logger.success('Successfully reloaded application (/) commands.')
    process.exit()
  } catch (error) {
    logger.error(error)
  }
})()
