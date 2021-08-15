module.exports = {
	userInfo: function(args = {}) {
		return {
			id: this.id_auteur || args.id_auteur,
			name: this.nom || args.nom || this.id_auteur || args.id_auteur || 'Aucun nom',
			score: this.score || args.score || 0,
			position: this.position || args.position,
			challengesLength: (this.challenges != null || args.challenges != null || []).length,
			solutionsLength: (this.solutions != null || args.solutions != null || []).length,
			validationsLength: (this.validations != null || args.validations != null || []).length,
			timestamp: this.timestamp || args.timestamp || undefined
		}
	}
}
