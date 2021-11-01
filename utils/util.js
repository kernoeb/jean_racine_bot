module.exports = {
  async pause(time = Number(process.env.PAUSE) || 1050) {
    await new Promise(r => setTimeout(r, time))
  }
}
