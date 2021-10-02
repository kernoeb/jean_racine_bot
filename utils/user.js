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
  }
}
