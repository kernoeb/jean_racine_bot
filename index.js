if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const logger = require('./utils/signale')

const packageJson = require('./package.json')
if (/^v(\d+)\./.exec(process.version)[1] < packageJson.engines.node) {
  logger.error('Please use ' + packageJson.engines.node + ' node version')
  process.exit(1)
}

const client = require('./utils/discord')()

const mongoose = require('./utils/mongoose')
const Agenda = require('agenda')
const agenda = new Agenda()

const { userInfo } = require('./utils/user')
const { challengeInfo, getCategory } = require('./utils/challenge')
const { updateUsers, fetchChallenges } = require('./utils/updates')
const { getScoreboard, updateScoreboards } = require('./utils/scoreboard')
const { getAgenda: initAgendaVotes } = require('./utils/ctftime')
const { getLastChallenges } = require('./utils/rss')

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

  const categories = getCategory(null, true)
  Object.keys(categories).forEach(key => {
    userSchemaTemplate[`score_${key}`] = { type: Number, index: true }
  })

  const userSchema = new mongoose.Schema(userSchemaTemplate)

  userSchema.index({ score: -1, nom: -1 })
  userSchema.index({ score: -1, nom: 1 })
  userSchema.index({ score: 1, nom: -1 })
  userSchema.index({ score: 1, nom: 1 })

  Object.keys(categories).forEach(key => {
    userSchema.index({ [`score_${key}`]: -1, nom: -1 })
    userSchema.index({ [`score_${key}`]: -1, nom: 1 })
    userSchema.index({ [`score_${key}`]: 1, nom: -1 })
    userSchema.index({ [`score_${key}`]: 1, nom: 1 })
  })

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
    validations: Number, // Deprecated
    difficulte: String,
    url_challenge: String,
    timestamp: Date
  }

  const challengeSchema = new mongoose.Schema(challengeSchemaTemplate)
  challengeSchema.methods.challengeInfo = challengeInfo

  challengeSchema.index(
    { titre: 'text', rubrique: 'text' },
    { weights: { titre: 10, rubrique: 2 } }
  )

  const Challenges = mongoose.model('challenge', challengeSchema)

  // Remove validations as it's not used anymore
  await Challenges.updateMany({}, { $unset: { 'validations': 1 } })

  const discordChannelsSchemaTemplate = {
    channelId: { type: String, required: true, unique: true, index: true },
    guildId: { type: String, required: true, unique: true, index: true },
    users: Array,
    scoreboard: {
      type: {
        messageId: { type: String, required: true, unique: true, index: true },
        channelId: { type: String, required: true, unique: true, index: true }
      },
      required: false
    }
  }
  const discordChannelsSchema = new mongoose.Schema(discordChannelsSchemaTemplate)
  const Channels = mongoose.model('channels', discordChannelsSchema)

  // User list synced to a role and a root-me user
  const syncedUserSchemaTemplate = {
    discordId: { type: String, required: true },
    rootmeId: { type: String, required: true },
    roleId: { type: String, required: true },
    guildId: { type: String, required: true }
  }

  const syncedUserSchema = new mongoose.Schema(syncedUserSchemaTemplate)

  syncedUserSchema.index({ guildId: 1, id_role: 1 })
  mongoose.model('syncedusers', syncedUserSchema)

  // Profile pictures cache
  const profilePicturesSchemaTemplate = {
    rootmeId: { type: String, required: true, unique: true, index: true },
    image: { type: String, required: true }
  }

  const profilePicturesSchema = new mongoose.Schema(profilePicturesSchemaTemplate)

  profilePicturesSchema.index({ rootmeId: 1 })
  mongoose.model('profilepictures', profilePicturesSchema)

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
  let LOADING_CHALLENGES = false
  let LOADING_USERS = false

  agenda.define('UPDATE_USERS', {}, async (job, done) => {
    if (LOADING_USERS === false) {
      LOADING_USERS = true
      updateUsers((await Channels.find({})).map(v => v.channelId)).then(() => {
        logger.success('UPDATE_USERS OK')
        LOADING_USERS = false
        done()
      }).catch(async err => {
        logger.error('UPDATE_USERS ERROR', err)
        setTimeout(() => {
          LOADING_USERS = false
          done()
        }, 10000)
      })
    } else {
      logger.info('Nope ! Already loading (users).')
      done()
    }
  })

  agenda.define('UPDATE_CHALLENGES', {}, async (job, done) => {
    if (LOADING_CHALLENGES === false) {
      LOADING_CHALLENGES = true
      fetchChallenges((await Channels.find({})).map(v => v.channelId)).then(() => {
        logger.success('UPDATE_CHALLENGES OK')
        LOADING_CHALLENGES = false
        done()
      }).catch(async err => {
        logger.error('UPDATE_CHALLENGES ERROR', err)
        setTimeout(() => {
          LOADING_CHALLENGES = false
          done()
        }, 10000)
      })
    } else {
      logger.info('Nope ! Already loading (challenges).')
      done()
    }
  })

  agenda.define('GET_FRESH_CHALLENGES', {}, (job, done) => {
    getLastChallenges().then(() => {
      logger.success('GET_FRESH_CHALLENGES OK')
      done()
    }).catch(async err => {
      logger.error('GET_FRESH_CHALLENGES ERROR', err)
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

    if (!process.env.NO_UPDATE) {
      if (!process.env.NO_UPDATE_USERS) {
        const UPDATE_USERS = agenda.create('UPDATE_USERS', {}).priority('highest')
        await UPDATE_USERS.repeatEvery(process.env.REPEAT_USERS || '40 seconds', { skipImmediate: false }).save()
      }

      if (!process.env.NO_UPDATE_CHALLENGES) {
        const UPDATE_CHALLENGES = agenda.create('UPDATE_CHALLENGES', {}).priority('lowest')
        await UPDATE_CHALLENGES.repeatEvery(process.env.REPEAT_CHALLENGES || '15 minutes', { skipImmediate: false }).save()
      }

      if (!process.env.NO_UPDATE_RSS) {
        const GET_FRESH_CHALLENGES = agenda.create('GET_FRESH_CHALLENGES', {}).priority('lowest')
        await GET_FRESH_CHALLENGES.repeatEvery('10 minutes', { skipImmediate: false }).save()
      }
    }
  })


  /** Discord.js **/
  client.once('ready', () => {
    logger.success('Ready!')

    try {
      // Initialize agenda with the good db
      const v = initAgendaVotes(db.db)
      logger.success('Agenda (votes) initialized successfully')
      v.on('ready', async () => {
        logger.success('Agenda (votes) started successfully')
        v.start()
      })
    } catch (err) {
      logger.error('Error while initializing agenda (votes)', err)
    }

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
      const content = 'There was an error while executing this command!'
      try {
        await interaction.reply({ content, ephemeral: true })
      } catch (err) {
        await interaction.editReply({ content, ephemeral: true }).catch((e) => {
          logger.error('Error while editing error interaction', e)
        })
        logger.error(err)
      }
    }
  })

  client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return

    try {
      if (/^go_.+_page_/.test(interaction.customId)) {
        const [, data,, page] = interaction.customId.split('_')
        let category, role, roleObj
        if (data.includes('::')) [category, role] = data.trim().split('::')
        else category = data.trim()

        if (role) {
          const guild = client.guilds.cache.get(interaction.guildId)
          if (guild) roleObj = guild.roles.cache.get(role)
          if (!roleObj || !roleObj.id) return interaction.reply({ content: 'Le rôle n\'existe pas ou plus :(', ephemeral: true })
        }

        return interaction.update(await getScoreboard({
          guildId: interaction.guildId,
          index: Number(page) || 0,
          category: Number(category) || undefined,
          role: roleObj || undefined,
          fromArrow: true
        }))
      } else if (interaction.customId.startsWith('go_page_')) {
        const page = interaction.customId.match(/page_(\d+)/)?.[1]?.trim()
        return interaction.update(await getScoreboard({
          guildId: interaction.guildId,
          index: Number(page) || 0,
          fromArrow: true
        }))
      }
    } catch (e) {
      logger.error(e)
      try {
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
      } catch (err) {
        logger.error(err)
      }
    }
  })

  client.login(process.env.TOKEN).then(() => {
    logger.success('Logged')
  })
})
