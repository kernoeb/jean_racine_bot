const { SlashCommandBuilder } = require('@discordjs/builders')
const axios = require('axios')
const { MessageEmbed } = require('discord.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('searchuser')
		.setDescription('Rechercher un utilisateur')
		.addStringOption(option =>
			option.setName('name')
				.setDescription('Nom d\'utilisateur')
				.setRequired(true)),

	async execute(interaction) {
		const name = interaction.options.getString('name') // Name

		try {
			const req = await axios.get(`${process.env.ROOTME_API_URL}/auteurs?nom=${name}`, { headers: { Cookie: `api_key=${process.env.API_KEY}` } })
			if (req?.data?.length === 2) {
				return await interaction.reply('Trop de résultats, sois plus précis stp !')
			} else if (Object.keys((req?.data?.[0] || {})).length) {
				const embed = new MessageEmbed().setTitle('IDs Utilisateurs')
				for (const userNb of Object.keys(req.data[0])) {
					embed.addField(req.data[0][userNb].nom, req.data[0][userNb].id_auteur, true)
				}
				return await interaction.reply({ embeds: [embed] })
			} else return await interaction.reply({ content: ':no_entry_sign: Aucun résultat (ou problème serveur)', ephemeral: true })
		} catch (err) {
			return await interaction.reply({ content: ':no_entry_sign: Aucun résultat (ou problème serveur)', ephemeral: true })
		}
	}
}

