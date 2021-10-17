const { ChartJSNodeCanvas } = require('chartjs-node-canvas')
const mongoose = require('../utils/mongoose')
const { DateTime } = require('luxon')

function range(i) {
  return [...Array(i).keys()]
}

async function getScore(id_challenge) {
  return (await mongoose.models.challenge.findOne({ id_challenge }) || {}).score || 0
}

module.exports = {
  async getMonthChart(guildId) {
    const channel = await mongoose.models.channels.findOne({ guildId })

    const tmpUsers = await mongoose.models.user.find({ id_auteur: { $in: (channel.users || []) } }, { validations: 1, score: 1, nom: 1 })
      .sort({ score: -1, nom: 1 })
      .limit(10)

    const datasets = []
    const colors = [
      'red',
      'purple',
      'blue',
      'orange',
      'green',
      'rgba(255, 99, 132, 0.2)',
      'rgba(54, 162, 235, 0.2)',
      'rgba(75, 192, 192, 0.2)',
      'rgba(153, 102, 255, 0.2)',
      'rgba(255, 159, 64, 0.2)'
    ]

    let count = 0
    for (const user of tmpUsers) {
      const now = DateTime.now().setLocale('fr')
      const beginMonth = now.startOf('month')
      const endMonth = beginMonth.setLocale('fr').plus({ month: 1 }).minus({ seconds: 1 })
      const datesOfTheMonth = await Promise.all((user.validations || []).map(async v => (
        { score: await getScore(Number(v.id_challenge)), date: DateTime.fromSQL(v.date).setLocale('fr') }
      )))
      const datesOfTheMonthSorted = datesOfTheMonth
        .filter(i => i.date >= beginMonth && i.date <= endMonth)
        .sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0)
      const monthPoints = user.score - datesOfTheMonthSorted.reduce((accum, obj) => accum + obj.score, 0)

      const data = []
      let m = monthPoints
      range(now.get('day') + 1).slice(1).forEach(index => {
        const tmpDatesOfDay = datesOfTheMonthSorted.filter(i => i.date.hasSame(beginMonth.setLocale('fr').plus({ day: index }), 'day'))
        const tmpScoresOfDay = (tmpDatesOfDay || []).map(v => v.score)
        if (tmpScoresOfDay.length) {
          m = m + (tmpScoresOfDay.reduce((p, c) => p + c, 0))
          data.push(m)
        } else {
          data.push(m)
        }
      })

      datasets.push({
        label: user.nom,
        data,
        fill: false,
        borderColor: colors[count],
        tension: 0.1
      })
      count++
    }


    const width = 650 // px
    const height = 450 // px

    const chartCallback = (ChartJS) => {
      ChartJS.defaults.responsive = true
      ChartJS.defaults.maintainAspectRatio = false
    }

    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, chartCallback })

    const configuration = {
      type: 'line',
      data: {
        labels: range(31 + 1).slice(1),
        datasets
      },
      plugins: [{
        id: 'background-colour',
        beforeDraw: (chart) => {
          const ctx = chart.ctx
          ctx.save()
          ctx.fillStyle = 'white'
          ctx.fillRect(0, 0, width, height)
          ctx.restore()
        }
      }]
    }

    return await chartJSNodeCanvas.renderToBuffer(configuration)
  }
}
