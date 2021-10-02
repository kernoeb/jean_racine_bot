module.exports = {
  async pause(time = 200) {
    await new Promise(r => setTimeout(r, time))
  }
}
