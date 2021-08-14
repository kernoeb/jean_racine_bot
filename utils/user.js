module.exports = {
	userInfo: function(args) {
		return {
			id: this.id_auteur || args.id_auteur,
			name: this.nom || args.nom || this.id_auteur || args.id_auteur,
			score: (this.score && Number(this.score)) || (args.score && Number(args.score)) || 0,
			position: this.position || args.position || '?',
			challengesLength: (this.challenges || args.challenges || []).length,
			solutionsLength: (this.solutions || args.solutions || []).length,
			validationsLength: (this.validations || args.validations || []).length,
			timestamp: this.timestamp || args.timestamp || undefined
		}
	}
}
