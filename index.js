if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const client = require('./utils/discord')()
const logger = require('./utils/signale')

const mongoose = require('./utils/mongoose')
const Agenda = require('agenda')
const agenda = new Agenda({
  maxConcurrency: 1,
  defaultLockLimit: 1,
  defaultConcurrency: 1,
  lockLimit: 1
})

const { userInfo } = require('./utils/user')
const { challengeInfo } = require('./utils/challenge')
const { updateUsers, fetchChallenges } = require('./utils/updates')

const db = mongoose.connection

db.on('error', console.error.bind(console, 'connection error:'))

db.once('open', async function() {
  logger.success('Mongo OK')

  logger.info('Agenda deleted', (await db.collection('agenda').deleteMany({})).deletedCount)

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
  agenda.define('UPDATE_USERS', {}, async (job, done) => {
    updateUsers((await Channels.find({})).map(v => v.channelId)).then(() => {
      logger.success('UPDATE_USERS OK')
      done()
    }).catch(err => {
      logger.error('UPDATE_USERS ERROR', err)
      done()
    })
  })

  agenda.define('UPDATE_CHALLENGES', {}, async (job, done) => {
    fetchChallenges((await Channels.find({})).map(v => v.channelId)).then(() => {
      logger.success('UPDATE_CHALLENGES OK')
      done()
    }).catch(err => {
      logger.error('UPDATE_CHALLENGES ERROR', err)
      done()
    })
  })

  agenda.mongo(db.db, 'agenda')

  agenda.on('ready', async () => {
    setTimeout(() => {
      agenda.start().then(() => {
        logger.success('Agenda started successfully')
      })
    }, 2500)

    const UPDATE_USERS = agenda.create('UPDATE_USERS', { }).priority('highest')
    await UPDATE_USERS.repeatEvery('1 minute', { skipImmediate: true }).save()

    const UPDATE_CHALLENGES = agenda.create('UPDATE_CHALLENGES', { }).priority('lowest')
    await UPDATE_CHALLENGES.repeatEvery('5 minutes and 10 seconds', { skipImmediate: true }).save()
  })


  /** Discord.js **/
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
