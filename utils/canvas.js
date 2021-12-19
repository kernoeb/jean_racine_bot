const Canvas = require('canvas')
const path = require('path')
const { getProfilePicture } = require('../utils/get_profile_picture')

async function roundRect(ctx, x, y, width, height, radius, fill, stroke, background) {
  if (typeof stroke === 'undefined') stroke = true
  if (typeof radius === 'undefined') radius = 5
  if (typeof radius === 'number') {
    radius = { tl: radius, tr: radius, br: radius, bl: radius }
  } else {
    const defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 }
    for (const side in defaultRadius) {
      radius[side] = radius[side] || defaultRadius[side]
    }
  }
  ctx.beginPath()
  ctx.moveTo(x + radius.tl, y)
  ctx.lineTo(x + width - radius.tr, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr)
  ctx.lineTo(x + width, y + height - radius.br)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height)
  ctx.lineTo(x + radius.bl, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl)
  ctx.lineTo(x, y + radius.tl)
  ctx.quadraticCurveTo(x, y, x + radius.tl, y)
  ctx.closePath()
  if (fill) {
    if (background) ctx.fillStyle = ctx.createPattern(background, 'repeat')
    ctx.fill()
  }
  if (stroke) {
    ctx.stroke()
  }

}

const setFont = (context, size, font) => {
  context.font = `${size}px ${font}`
}

module.exports = async function getCanvas({ typeText, user, challUsers, chall }) {
  Canvas.registerFont(path.join(process.cwd(), '/assets/Staatliches.ttf'), { family: 'Staatliches' })
  Canvas.registerFont(path.join(process.cwd(), '/assets/ContrailOne.ttf'), { family: 'ContrailOne' })
  Canvas.registerFont(path.join(process.cwd(), '/assets/gimenell.ttf'), { family: 'gimenell' })

  const canvas = Canvas.createCanvas(700, 300)
  const context = canvas.getContext('2d')

  const background = await Canvas.loadImage(path.join(process.cwd(), '/assets/bg_dark.jpg'))
  await roundRect(context, 0, 0, canvas.width, canvas.height, 20, true, false, background)

  const leftX = 65
  const topY = 80

  setFont(context, 45, 'Staatliches')
  context.fillStyle = '#afffbf'

  context.fillText(typeText, leftX, topY)
  const typeTextWidth = context.measureText(typeText)

  setFont(context, 30, 'Staatliches')
  context.fillStyle = '#e3e3e3'
  context.fillText(user.username, leftX + 65, topY + 47)

  if (user.score) {
    setFont(context, 20, 'Staatliches')
    context.fillStyle = '#989898'
    context.fillText('Score: ' + user.score, leftX + 65, topY + 25 + 50)
  }

  const getImage = await getProfilePicture(user.id, true)
  const avatar = await Canvas.loadImage(getImage || `${process.env.ROOTME_URL}/IMG/logo/auton0.png`)
  context.drawImage(avatar, leftX, topY + 25, 50, 50)

  let pointWidth = 0
  if (chall.points) {
    setFont(context, 20, 'Staatliches')
    pointWidth = context.measureText(chall.points + ' points').width
  }

  let defaultFontSize = 30
  setFont(context, defaultFontSize, 'Staatliches')
  context.fillStyle = '#faffa5'

  // Ensure that the text is not too long to fit in the canvas
  while ((leftX + context.measureText(chall.title).width + 20 + pointWidth) >= canvas.width) {
    defaultFontSize -= 4
    setFont(context, defaultFontSize, 'Staatliches')
  }

  context.fillText(chall.title, leftX, topY + 125)

  if (chall.points) {
    context.fillStyle = '#bdbdbd'
    const tmpX = leftX + context.measureText(chall.title).width + 20
    setFont(context, 20, 'Staatliches')
    context.fillText(chall.points + ' points', tmpX, topY + 125)
  }

  context.fillStyle = '#888888'
  setFont(context, 20, 'sans-serif')
  context.fillText(chall.date, leftX, topY + 155)

  if (challUsers && Object.keys(challUsers).length) {
    if (!challUsers.firstBlood) {
      context.fillStyle = '#bdbdbd'
      if (chall.validations) context.fillText(chall.validations + ' validations · ' + challUsers.serverRank + 'ème du serveur', leftX, topY + 180)
      else context.fillText(challUsers.serverRank + 'ème du serveur', leftX, topY + 180)
    } else {
      context.fillStyle = '#bdbdbd'
      if (chall.validations) context.fillText(chall.validations + ' validations · 1er du serveur', leftX, topY + 180)
      else context.fillText('1er du serveur', leftX, topY + 180)
      const firstBlood = await Canvas.loadImage(path.join(process.cwd(), '/assets/firstblood.png'))
      context.drawImage(firstBlood, leftX + typeTextWidth.width + 10, topY - typeTextWidth.emHeightAscent + 2, 50, 50)
    }
  }

  return canvas
}
