const curl = require('../utils/curl')

const hostname = process.env.ROOTME_URL.replace(/https?:\/\//, '')

module.exports = {
  async getProfilePicture(id, asImage) {
    try {
      const url = `/IMG/logo/auton${id}.jpg`
      const { data } = await curl.get(url, { customHostname: hostname })
      return asImage ? data : process.env.ROOTME_URL + url
    } catch (err) {}
    try {
      const url = `/IMG/logo/auton${id}.png`
      const { data } = await curl.get(url, { customHostname: hostname })
      return asImage ? data : process.env.ROOTME_URL + url
    } catch (err) {}
    try {
      const url = `/IMG/logo/auton${id}.gif`
      const { data } = await curl.get(url, { customHostname: hostname })
      return asImage ? data : process.env.ROOTME_URL + url
    } catch (err) {}
    try {
      const url = '/IMG/logo/auton0.png'
      const { data } = await curl.get(url, { customHostname: hostname })
      return asImage ? data : process.env.ROOTME_URL + url
    } catch (err) {}
    return null
  }
}
