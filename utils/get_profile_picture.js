const axios = require('../utils/axios')
module.exports = {
  async getProfilePicture(id) {
    try {
      const url = `${process.env.ROOTME_URL}/IMG/auton${id}.jpg`
      await axios.get(url, { params: { fakeHash: new Date().getTime() } })
      return url
    } catch (err) {}
    try {
      const url = `${process.env.ROOTME_URL}/IMG/auton${id}.png`
      await axios.get(url, { params: { fakeHash: new Date().getTime() } })
      return url
    } catch (err) {}
    try {
      const url = `${process.env.ROOTME_URL}/IMG/auton${id}.gif`
      await axios.get(url, { params: { fakeHash: new Date().getTime() } })
      return url
    } catch (err) {}
    return null
  }
}
