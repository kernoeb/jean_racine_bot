if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config()
}

const { Client, Collection, Intents } = require('discord.js')
const fs = require('fs')
const logger = require('./utils/signale')

const mongoose = require('./utils/mongoose')
const Agenda = require('agenda')
const agenda = new Agenda()

const { userInfo } = require('./utils/user')
const { challengeInfo } = require('./utils/challenge')
const { updateUsers, fetchChallenges } = require('./utils/updates')

const db = mongoose.connection

let client

db.on('error', console.error.bind(console, 'connection error:'))

db.once('open', async function() {
	logger.success('Mongo OK')

	/** Schema configuration **/
	const userSchemaTemplate = {
		id_auteur: { type: String, required: true, unique: true },
		nom: { type: String, required: true },
		statut: String,
		score: { type: Number, default: 0 },
		position: { type: Number, default: 0 },
		challenges: Array,
		solutions: Array,
		validations: Array,
		timestamp: Date
	}
	const userSchema = new mongoose.Schema(userSchemaTemplate)
	userSchema.methods.userInfo = userInfo
	mongoose.model('user', userSchema)

	const challengeSchemaTemplate = {
		id_challenge: { type: Number, required: true, unique: true },
		id_rubrique: Number,
		titre: String,
		soustitre: String,
		rubrique: String,
		lang: String,
		date_publication: Date,
		score: Number,
		auteurs: Array,
		validations: Number,
		difficulte: String,
		url_challenge: String,
		timestamp: Date
	}
	const challengeSchema = new mongoose.Schema(challengeSchemaTemplate)
	challengeSchema.methods.challengeInfo = challengeInfo
	const Challenges = mongoose.model('challenge', challengeSchema)

	const discordChannelsSchemaTemplate = {
		channelId: { type: String, required: true, unique: true },
		guildId: { type: String, required: true, unique: true },
		users: Array
	}
	const discordChannelsSchema = new mongoose.Schema(discordChannelsSchemaTemplate)
	const Channels = mongoose.model('channels', discordChannelsSchema)

	if (!await Challenges.countDocuments({})) {
		logger.info('Loading challenges, please wait...')
		try {
			await fetchChallenges()
			logger.success('Challenges loaded successfully')
		} catch (err) {
			logger.error('Error while loading challenges', err)
		}
	} else {
		logger.info('Challenges already loaded')
	}

	/** Agenda configuration **/
	agenda.define('UPDATE_USERS', async () => {
		updateUsers(client, (await Channels.find({})).map(v => v.channelId))
	})

	agenda.define('UPDATE_CHALLENGES', async () => {
		fetchChallenges(client, (await Channels.find({})).map(v => v.channelId))
	})

	agenda.mongo(db.db, 'agenda')

	agenda.on('ready', () => {
		setTimeout(() => {
			agenda.start().then(() => {
				logger.success('Agenda started successfully')
			})
		}, 5000)

		agenda.every('15 minutes', 'UPDATE_USERS').then(() => {
			logger.success('UPDATE_DATABASE initialized successfully')
		})
		agenda.every('1 hour', 'UPDATE_CHALLENGES').then(() => {
			logger.success('UPDATE_CHALLENGES initialized successfully')
		})
	})


	/** Discord.js **/
	client = new Client({ intents: [Intents.FLAGS.GUILDS] })
	client.commands = new Collection()

	const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))

	for (const file of commandFiles) {
		const command = require(`./commands/${file}`)
		// set a new item in the Collection
		// with the key as the command name and the value as the exported module
		client.commands.set(command.data.name, command)
	}

	client.once('ready', () => {
		logger.success('Ready!')
	})

	client.on('interactionCreate', async interaction => {
		if (!interaction.isCommand()) return

		if (!client.commands.has(interaction.commandName)) return

		try {
			logger.log(interaction.commandName)
			await client.commands.get(interaction.commandName).execute(interaction)
		} catch (error) {
			logger.error(error)
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
		}
	})

	client.login(process.env.TOKEN).then(() => {
		logger.success('Logged')
	})
})
