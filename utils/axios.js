const axios = require('axios')
let instance

module.exports = function() {
  if (instance) return instance

  instance = axios.create({
    baseURL: process.env.ROOTME_API_URL,
    timeout: 2500,
    headers: { Cookie: `api_key=${process.env.API_KEY}` },
    withCredentials: true
  })

  return instance
}
