const express = require('express')
const getCanvas = require('../utils/canvas')

const app = express()
const port = 3000

app.get('/', async (req, res) => {
  res.set('Content-Type', 'image/png')
  res.send((await getCanvas()).toBuffer())
})
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
