const axios = require('axios')
const http = require('http')
const https = require('https')

const instance = axios.create({
  baseURL: process.env.ROOTME_API_URL,
  timeout: 3000,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true })
})

module.exports = {
  async getProfilePicture(id) {
    try {
      const url = `${process.env.ROOTME_URL}/IMG/auton${id}.jpg`
      await instance.get(url, { params: { fakeHash: new Date().getTime() } })
      return url
    } catch (err) {}
    try {
      const url = `${process.env.ROOTME_URL}/IMG/auton${id}.png`
      await instance.get(url, { params: { fakeHash: new Date().getTime() } })
      return url
    } catch (err) {}
    try {
      const url = `${process.env.ROOTME_URL}/IMG/auton${id}.gif`
      await instance.get(url, { params: { fakeHash: new Date().getTime() } })
      return url
    } catch (err) {}
    try {
      const url = `${process.env.ROOTME_URL}/IMG/auton0.png`
      await instance.get(url)
      return url
    } catch (err) {}
    return null
  }
}
