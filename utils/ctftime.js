module.exports = {
  formattedEmbed: (body, start_time, end, duration) => {
    return `**Démarre le :** ${start_time[0]}, à ${start_time[1]} \n
                **Organisé par :** ${body.organizers[0].name} \n
                **Termine le :** ${end[0]}, à ${end[1]} \n
                **Site Web :** ${body.url} \n
                **URL CTFTime :** ${body.ctftime_url} \n
                **IRL :** ${body.onsite ? 'Oui' : 'Non'} \n
                **Format :** ${body.format} \n 
                **Durée :** ${duration} \n 
                **Nombre d'équipes intéressées :** ${body.participants} \n
                **Poids :** ${body.weight} \n
                **CTF ID :** ${body.id}`
  }
}
