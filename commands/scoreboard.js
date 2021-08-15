const { SlashCommandBuilder } = require('@discordjs/builders')
const mongoose = require('../utils/mongoose')
const { MessageEmbed } = require('discord.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('scoreboard')
		.setDescription('Tableau des scores'),
	async execute(interaction) {
		const channel = await mongoose.models.channels.findOne({ channelId: interaction.channelId, guildId: interaction.guildId })

		if (!channel)
			return await interaction.reply({ content: ':no_entry_sign: Pas la permission dans ce canal ! (**/init**)', ephemeral: true })

		const tmpUsers = await mongoose.models.user.find({ id_auteur: { $in: (channel.users || []) } }).sort({ score: -1 }) // Get all users
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

