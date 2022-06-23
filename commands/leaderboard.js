const { SlashCommandBuilder } = require('@discordjs/builders');
const { curly } = require('node-libcurl');
const {MessageEmbed} = require('discord.js');
const logger = require("signale-logger")


module.exports = {
    data: new SlashCommandBuilder()
        .setName('topctftimelocale')
        .setDescription("Show the Top 10 teams in CTFTime from a given country")
        .addStringOption(option => option.setName('locale').setDescription('the country you want to see the top 10 teams (ex: fr, us, ...)')),
    async execute(interaction) {
        let x = 0;
        //keep track of the exectuion to show the right error message if any
        let execution = 0;
        // Get the locale parameter
        let locale = interaction.options.getString('locale');
        // Checks if the user provided a locale
        if(!locale){
            return await interaction.reply("Please specify a locale");
        }
        // Defer the reply to permit more time to execute the command
        await interaction.deferReply();
        // Prepare the url
        locale = locale.toUpperCase();
        // Scrap the data from the CTFTime website
        curly.get('https://ctftime.org/stats/'+locale)
        .then(
            // Parse the data to text
            async response => {
                execution +=1;
                //console.log(response)
                // Check if the request was successful
                if(response.statusCode == 200){
                    // Get the data
                    return response.data;
                }
                else{
                    // If the request was not successful, show the error message
                    throw error("Error while fetching the CTF make sure that the locale is correct");
                }
            },
            async err => {
                
                throw error("Internal error on fetch " + err);
            }
        )
        .then(
            text =>
            {
                // Get the top 10 teams
                execution +=1;
                let txtparse = text.split("\n");
                let top10 = [];
                let i = 0;
                for (const string of txtparse) {
                    if(string.includes('<tr><td class="place">') && i < 10){
                        let str = "";
                        str += string;
                        top10.push(str.trim());
                        i++;
                    }
                }
                return top10;
            },
            async err =>
            {
                throw error(err);
            }
        )
        .then(
            (top10) => 
            {
                // Get the TOP 10 teams ids
                execution +=1;
                let ids = [];
                for(let j = 0; j< top10.length; j++){
                    for(let k = 0; k<top10[j].length;k++){
                        if(top10[j][k]<= '9' && top10[j][k]>='0' && top10[j][k-1] == '/'){
                            let id = "" + top10[j][k];
                            while(top10[j][k+1] != '"'){
                                k++;
                                id+=top10[j][k];
                            }
                            ids.push([id,j+1]);
                        }
                    }
                }
                return ids;
            },
            async err => 
            {
                throw error(err);
            }
        )
        .then(
            async ids => {
                // construct the embed
                execution +=1;
                let msgtop10 = new MessageEmbed();
                msgtop10.setTitle("Top 10 CTF Time Teams from "+locale);
                msgtop10.setThumbnail("https://avatars.githubusercontent.com/u/2167643?s=200&v=4");
                msgtop10.setURL("https://ctftime.org/");
                interaction.editReply({ embeds: [msgtop10]});
                function master(){
                    // Set an interval to avoid the rate limit
                    const inter = setInterval(messageSender,1500);
                    async function messageSender(){
                        if(x < 10){
                            let [id,place] = ids[x];
                            // get the team name via the CTF time API
                            curly.get(`https://ctftime.org/api/v1/teams/${id}/`).then((resp) => resp.data).then(
                                async json => {
                                    
                                    msgtop10.addField(json.name, "Place : " + place);
                                    try{
                                        await interaction.editReply({ embeds: [msgtop10]});
                                    }
                                    catch(err){
                                        await interaction.editReply({ embeds: [msgtop10]});
                                        console.error(err);
                                    }
                                    
        
                                },
                                async err => {
                                    console.error(err);
                                    await interaction.editReply("Error");
                                    return "";
                                }
                                );
                        }
                        else{
                            clearInterval(inter);
                        }
                        x++;
                    }
                }
                master();
                return;
            },
            async err => 
            {
                throw error(err);
            }
        )
        .catch(
            async err => {
                errorHandler();
                return;
            }
        )
        async function errorHandler(){
            let content = "";
            switch(execution){
                case 1:
                    content = "Error: error while fetching the CTF because the locale "+ locale +" is wrong or CTF is down\n";
                    logger.error(content);
                    await interaction.editReply(content);
                    break;
                case 2:
                    content = "Error: error while parsing the page\n";
                    logger.error(content);
                    await interaction.editReply(content);
                    break;
                case 3:
                    content = "Error: error while parsing the ids\n";
                    logger.error(content);
                    await interaction.editReply(content);
                    break;
                case 4:
                    content = "Error: error while creating the embed and parsing the teams informations\n";
                    logger.error(content);
                    await interaction.editReply(content);
                    break;
            }
        }
    },
};