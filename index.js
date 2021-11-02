if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const logger = require('./utils/signale')

const packageJson = require('./package.json')
if (process.version !== packageJson.engines.node) {
  logger.error('Please use ' + packageJson.engines.node + ' node version')
  process.exit(1)
}

const client = require('./utils/discord')()

const mongoose = require('./utils/mongoose')
const Agenda = require('agenda')
const agenda = new Agenda()

const { userInfo } = require('./utils/user')
const { challengeInfo } = require('./utils/challenge')
const { updateUsers, fetchChallenges } = require('./utils/updates')
const { getScoreboard, updateScoreboards } = require('./utils/scoreboard')

const db = mongoose.connection

db.on('error', console.error.bind(console, 'connection error:'))

db.once('open', async function() {
  logger.success('Mongo OK')

  logger.info('Agenda deleted', (await db.collection('agenda').deleteMany({})).deletedCount)

  /** Schema configuration **/
  const userSchemaTemplate = {
    id_auteur: { type: String, required: true, unique: true, index: true },
    nom: { type: String, required: true, index: true },
    statut: String,
    score: { type: Number, default: 0, index: true },
    position: { type: Number, default: 0, index: true },
    challenges: Array,
    solutions: Array,
    validations: Array,
    timestamp: Date
  }
  const userSchema = new mongoose.Schema(userSchemaTemplate)

  userSchema.index({ score: -1, nom: -1 })
  userSchema.index({ score: -1, nom: 1 })
  userSchema.index({ score: 1, nom: -1 })
  userSchema.index({ score: 1, nom: 1 })

  userSchema.methods.userInfo = userInfo
  mongoose.model('user', userSchema)

  const challengeSchemaTemplate = {
    id_challenge: { type: Number, required: true, unique: true, index: true },
    id_rubrique: { type: Number, index: true },
    titre: { type: String, index: true },
    soustitre: String,
    rubrique: String,
    lang: String,
    date_publication: Date,
    score: { type: Number, index: true },
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
    channelId: { type: String, required: true, unique: true, index: true },
    guildId: { type: String, required: true, unique: true, index: true },
    users: Array,
    scoreboard: {
      messageId: { type: String, required: true, unique: true, index: true },
      channelId: { type: String, required: true, unique: true, index: true }
    }
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
  let BANNED = false
  let LOADING_CHALLENGES = false
  let LOADING_USERS = false

  agenda.define('UPDATE_USERS', {}, async (job, done) => {
    if (BANNED === false && LOADING_USERS === false) {
      LOADING_USERS = true
      updateUsers((await Channels.find({})).map(v => v.channelId)).then(() => {
        logger.success('UPDATE_USERS OK')
        LOADING_USERS = false
        done()
      }).catch(async err => {
        logger.error('UPDATE_USERS ERROR', err)

        if (err.code === 'ECONNRESET' || err.code === 'ECONNABORTED' || err === 'DOWN_OR_BANNED') {
          logger.error('BANNED ! (users)')
          BANNED = true
          await new Promise(resolve => setTimeout(resolve, 1000 * 60 * 6))
          logger.info('Pause finished after 6 minutes (users)')
          BANNED = false
          LOADING_USERS = false
          done()
        } else {
          LOADING_USERS = false
          done()
        }
      })
    } else {
      logger.info('Nope ! Currently banned (users).')
      done()
    }
  })

  agenda.define('UPDATE_CHALLENGES', {}, async (job, done) => {
    if (BANNED === false && LOADING_CHALLENGES === false) {
      LOADING_CHALLENGES = true
      fetchChallenges((await Channels.find({})).map(v => v.channelId)).then(() => {
        logger.success('UPDATE_CHALLENGES OK')
        LOADING_CHALLENGES = false
        done()
      }).catch(async err => {
        logger.error('UPDATE_CHALLENGES ERROR', err)

        if (err.code === 'ECONNRESET' || err.code === 'ECONNABORTED' || err === 'DOWN_OR_BANNED') {
          logger.error('BANNED ! (challenges)')
          BANNED = true
          await new Promise(resolve => setTimeout(resolve, 1000 * 60 * 6))
          logger.info('Pause finished after 6 minutes (challenges)')
          BANNED = false
          LOADING_CHALLENGES = false
          done()
        } else {
          LOADING_CHALLENGES = false
          done()
        }
      })
    } else {
      logger.info('Nope ! Currently banned (challenges).')
      done()
    }
  })

  agenda.mongo(db.db, 'agenda')

  agenda.on('ready', async () => {
    setTimeout(() => {
      agenda.start().then(() => {
        logger.success('Agenda started successfully')
      })
    }, 2500)

    if (!process.env.NO_UPDATE) {
      const UPDATE_USERS = agenda.create('UPDATE_USERS', {}).priority('highest')
      await UPDATE_USERS.repeatEvery(process.env.REPEAT_USERS || '5 seconds', { skipImmediate: false }).save()

      if (!process.env.NO_UPDATE_CHALLENGES) {
        const UPDATE_CHALLENGES = agenda.create('UPDATE_CHALLENGES', {}).priority('lowest')
        await UPDATE_CHALLENGES.repeatEvery(process.env.REPEAT_CHALLENGES || '2 minutes', { skipImmediate: false }).save()
      }
    }
  })


  /** Discord.js **/
  client.once('ready', () => {
    logger.success('Ready!')

    setTimeout(() => {
      updateScoreboards().catch(() => {
        logger.error('Error while updating scoreboards')
      })
    }, 1500)
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

  client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return

    if (interaction.customId.startsWith('go_page_')) return interaction.update(await getScoreboard({ guildId: interaction.guildId, index: interaction.customId.split('go_page_')[1] }))
  })

  client.login(process.env.TOKEN).then(() => {
    logger.success('Logged')
  })
})
