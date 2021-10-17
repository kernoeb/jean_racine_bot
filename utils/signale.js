const signale = require('signale-logger')

signale.config({
  displayFilename: true,
  displayTimestamp: true,
  timeZone: 'Europe/Paris'
})

module.exports = signale
