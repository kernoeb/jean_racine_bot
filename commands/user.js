const { SlashCommandBuilder } = require('@discordjs/builders')
const mongoose = require('../utils/mongoose')
const { MessageEmbed } = require('discord.js')
const axios = require('axios')
const { userInfo } = require('../utils/user')
const { DateTime } = require('luxon')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('user')
		.setDescription('Informations sur un utilisateur')
		.addStringOption(option =>
			option.setName('id')
				.setDescription('Identifiant de l\'utilisateur')
				.setRequired(true)),

	async execute(interaction) {
		const id = interaction.options.getString('id') // ID
		let req = undefined
		let u = undefined

		try {
			req = await axios.get(`${process.env.ROOTME_API_URL}/auteurs/${id}?${new Date().getTime()}`, { headers: { Cookie: `api_key=${process.env.API_KEY}` } })
			u = userInfo(req.data) // Get user info
		} catch (err) {
			if (err && err.response && err.response.status === 404) return await interaction.reply({ content: 'Utilisateur inexistant', ephemeral: true })

			const tmpUser = await mongoose.models.user.findOne({ id_auteur: id }) // Find if backed up
			if (tmpUser) {
				u = tmpUser.userInfo() // Get user info
				u.backup = true
			}
		}

		if (u && !!Object.keys(u).length) {
			const embed = new MessageEmbed()
				.setColor('#0099ff')
				.setTitle(u.name)
				.setDescription(`**ID:** ${u.id}`)
				.setThumbnail(`${process.env.ROOTME_URL}/IMG/auton${u.id}.jpg`)
				.addFields(
					{ name: 'Score', value: u.score.toString() },
					{ name: 'Position', value: u.position.toString() },
					{ name: 'Challenges', value: u.challengesLength.toString(), inline: true },
					{ name: 'Solutions', value: u.solutionsLength.toString(), inline: true },
					{ name: 'Validations', value: u.validationsLength.toString(), inline: true }
				)
			if (u.backup) embed.setFooter('⚠️ Sauvegarde locale du ' + (DateTime.fromJSDate(u.timestamp).setLocale('fr').toLocaleString(DateTime.DATETIME_MED)))

			return await interaction.reply({ embeds: [embed] })
		} else {
			return await interaction.reply('Utilisateur inexistant' + (req === undefined ? ' ou serveur indisponible' : ''))
		}
	}
}
