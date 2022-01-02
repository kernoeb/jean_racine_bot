const { MessageEmbed } = require('discord.js')
const { DateTime } = require('luxon')
const decode = require('html-entities').decode
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const curl = require('../utils/curl')

const customHostname = process.env.ROOTME_URL.replace(/https?:\/\//, '')

/* const getDate = (date) => {
  return '<t:' + (DateTime.fromSQL(date).setLocale('fr').valueOf() / 1000) + ':R>'
}*/

module.exports = {
  getCategory: function(category, all = false) {
    const categories = {
      '16': { title: 'Web - Client', image: 'web-client' },
      '17': { title: 'Programmation', image: 'programmation' },
      '18': { title: 'Cryptanalyse', image: 'cryptanalyse' },
      '67': { title: 'Stéganographie', image: 'steganographie' },
      '68': { title: 'Web - Serveur', image: 'web-serveur' },
      '69': { title: 'Cracking', image: 'cracking' },
      '70': { title: 'Réaliste', image: 'realiste' },
      '182': { title: 'Réseau', image: 'reseau' },
      '189': { title: 'App - Script', image: 'app-script' },
      '203': { title: 'App - Système', image: 'app-systeme' },
      '208': { title: 'Forensic', image: 'forensic' }
    }
    if (all) return categories
    return categories[category]
  },
  getNumberOfValidations:  async function(challId) {
    try {
      const dom = new JSDOM((await curl.get(null, {
        customHostname,
        params: { page: 'structure', inc: 'inclusions/qui_a_valid', id_c: challId, lang: 'fr', ajah: 1, var_mode: 'calcul' }
      })).data)
      return Number(dom.window?.document?.querySelector('h3')?.textContent?.match(/\d+/g)?.[0].trim()) || null
    } catch (error) {
      console.log(error)
      return null
    }
  },
  challengeInfo: function(args = {}) {
    return {
      id: this.id_challenge || args.id_challenge,
      title: decode(this.titre) || decode(args.titre) || this.id_challenge || args.id_challenge,
      description: decode(this.soustitre) || decode(args.soustitre),
      score: this.score || args.score || 0,
      rubrique: this.rubrique || args.rubrique,
      date: this.date_publication || args.date_publication,
      url: this.url_challenge || args.url_challenge,
      authors: (this.auteurs && this.auteurs.length ? this.auteurs.map(v => v.nom).join(',') : undefined)
          || (args.auteurs && args.auteurs.length
            ? args.auteurs.map(v => v.nom).join(',') : undefined),
      validations: this.validations || args.validations,
      difficulty: this.difficulte || args.difficulte,
      timestamp: this.timestamp || args.timestamp
    }
  },
  challengeEmbed: function(u, newChall = false, users = null) {
    const embed = new MessageEmbed()
      .setTitle(`**${newChall ? 'Nouveau challenge :' : 'Challenge : '}** ` + (u.title || '') + ` (${u.id})`)
      .setDescription(u.description || 'Aucune description')

    if (u.authors != null && u.authors !== '') embed.setAuthor(u.authors)
    if (u.validations != null && u.validations !== '') embed.addField('Validations', u.validations.toString())
    if (u.rubrique != null && u.rubrique !== '') embed.addField('Catégorie', u.rubrique.toString(), true)
    if (u.difficulty != null && u.difficulty !== '') embed.addField('Difficulté', u.difficulty.toString(), true)
    if (u.score != null && u.score !== '') embed.addField('Score', u.score.toString(), true)
    if (u.url != null && u.url !== '') embed.setURL(`${process.env.ROOTME_URL}/${u.url}`)

    if (users) embed.addField('Flaggeurs', users.join(', '))

    if (u.backup) embed.setFooter('⚠️ Sauvegarde locale du ' + (DateTime.fromJSDate(u.timestamp).setLocale('fr').toLocaleString(DateTime.DATETIME_MED)))

    return embed
  }
}
