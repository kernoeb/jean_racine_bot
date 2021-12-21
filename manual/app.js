const express = require('express')
const getCanvas = require('../utils/canvas')

const app = express()
const port = 3000

app.get('/', async (req, res) => {
  res.set('Content-Type', 'image/png')

  const obj = {
    typeText: 'Nouveau challenge validé',
    channel: {},
    user: { username: 'jozay', id: '4444', score: 405 },
    challUsers: { serverRank: 12 },
    chall: {
      title: 'ELF x86 - Basique',
      points: 5,
      date: '26 déc. 2012, 16:58',
      category: 68,
      validations: 26798
    }
  }

  res.send((await getCanvas(obj)).toBuffer())
})
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
