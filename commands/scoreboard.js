const { SlashCommandBuilder } = require('@discordjs/builders')
const mongoose = require('../utils/mongoose')
const { MessageEmbed } = require('discord.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('scoreboard')
		.setDescription('Tableau d\'affichage des utilisateurs sauvegardés'),
	async execute(interaction) {
		const tmpUsers = await mongoose.models.user.find({}).sort({ score: -1 }) // Get all users
		if (tmpUsers && tmpUsers.length) {
			const embed = new MessageEmbed().setTitle(`Utilisateurs (${tmpUsers.length})`)
			for (const user of tmpUsers) {
				const tmpUser = user.userInfo()
				embed.addField(`${tmpUser.name} (${tmpUser.id})`, tmpUser.score.toString() + ' points')
			}
			return await interaction.reply({ embeds: [embed] })
		}
		return await interaction.reply(':no_entry_sign: Aucun utilisateur enregistré !')
	}
}

