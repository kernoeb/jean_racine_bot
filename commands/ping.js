const { SlashCommandBuilder } = require('@discordjs/builders')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Vive le tennis de table :ping_pong:'),
	async execute(interaction) {
		await interaction.reply({ files: ['https://media.giphy.com/media/sz3pnTuOYyupa/source.gif'] })
	}
}
