const { SlashCommandBuilder } = require('@discordjs/builders');
const { curly } = require('node-libcurl');
const {MessageEmbed} = require('discord.js');
const logger = require('../utils/signale');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('pickctf')
        .setDescription('Choose a CTF from CTF time and create a pool to see who is interested in it')
        .addIntegerOption(option => option.setName('id').setDescription('the id of the CTF').setRequired(true)),
    async execute(interaction) {
        //Checking for the permission
        let id = interaction.options.getInteger('id');
        if(!id){
            return interaction.reply("Please specify a CTF id");
        }
        await interaction.deferReply();
        curly.get(`https://ctftime.org/api/v1/events/${id}/`)
            .then(
                response => {
                    if(response.statusCode == 200){
                        return response.data
                    }
                    else{
                        throw logger.error("Error while fetching the CTF");
                    }
                    
                },
                err => {
                    throw error(err);
                }
            )
            .then(
                async body => {
                    let start = body.start.split('T');
                    let end = body.finish.split('T');
                    let embed = new MessageEmbed()
                        .setTitle("Poll for the next CTF")
                        .setDescription(body.title,`${body.description}`)
                        .setColor('#36393f')
                        .addField(
                            ":information_source: Infos",
                            `**Starts on :** ${start[0]}, at : ${start[1]} \n
                            **Host by :** ${body.organizers.name} \n
                            **Ends :** ${end[0]}, at : ${end[1]} \n
                            **Website :** ${body.url} \n
                            **CTF Time URL :** ${body.ctftime_url} \n
                            **IRL CTF ? :** ${body.onsite} \n
                            **Format :** ${body.format} \n 
                            **Duration :** ${body.duration.hours} Heures & ${body.duration.days} Jours \n 
                            **Number of Teams Interested :** ${body.participants} \n
                            **Weight** ${body.weight} \n
                            **CTF ID :** ${body.id}`
                        )
                        .setThumbnail(body.logo);
                    await interaction.editReply({embeds: [embed]});
                    const msg = await interaction.fetchReply();
                    msg.react('✅').then(() => msg.react('❌'));
                    const reactionArray = ['✅', '❌'];
                    async function vote(){
                        interaction.fetchReply().then(async msg => {
                            let count = [];
                            for(let i = 0; i < reactionArray.length; i++){
                                count[i] = msg.reactions.cache.get(reactionArray[i]).count -1; // Removes the bot's vote
                            }
                            let nbVote = count[0] + count[1];
                            let embed = new MessageEmbed()
                                .setTitle("Results of the poll")
                                .setDescription(`The poll has ended, the results are :`)
                                .addField("Stats : ",`✅ : ${100 * count[0] / nbVote}% \n ❌ : ${100 * count[1] / nbVote}% \n Number of votes : ${nbVote}`)
                                .setThumbnail(body.logo);
                            await interaction.followUp({embeds: [embed]});
                        })
                    }
                    setTimeout(vote,24 * 60 * 60 * 1000);
                },
                async err => {
                    let content = "Error: The id " + id +" is incorect or CTFTime is down";
                    await interaction.editReply(content);
                    logger.error(content);
                }
            )
    }
};