const mongoose = require('../utils/mongoose')
const { DateTime } = require('luxon')

module.exports = {
  userInfo: function(args = {}) {
    return {
      id: this.id_auteur || args.id_auteur,
      name: this.nom || args.nom || this.id_auteur || args.id_auteur || 'Aucun nom',
      score: this.score || args.score || 0,
      position: this.position || args.position,
      challengesLength: (this.challenges || args.challenges || []).length,
      solutionsLength: (this.solutions || args.solutions || []).length,
      validationsLength: (this.validations || args.validations || []).length,
      validationsIds: (this.validations || args.validations || []).map(v => v.id_challenge),
      timestamp: this.timestamp || args.timestamp || undefined
    }
  },
  validUsers: async function({ challId, guildId }) {
    let validUsers = null
    try {
      const guildUsers = (await mongoose.models.channels.findOne({ guildId }) || {}).users
      const users = (await mongoose.models.user.find({ id_auteur: { $in: guildUsers } }) || [])
      validUsers = users.filter(v => v && v.validations && v.validations.length && v.validations.some(i => i.id_challenge === challId))
        .sort((a, b) => DateTime.fromSQL((a.validations.find(i => i.id_challenge === challId) || {}).date).setLocale('fr').toMillis() - DateTime.fromSQL((b.validations.find(i => i.id_challenge === challId) || {}).date).setLocale('fr').toMillis())
        .map(v => v.nom)
    } catch (err) {
      console.error(err)
    }
    return validUsers
  }
}
