const axios = require('axios')
const logger = require('../utils/signale')
const http = require('http')
const https = require('https')
const { ConcurrencyManager } = require('./concurrency')

logger.log('Axios instantiated')

const instance = axios.create({
  baseURL: process.env.ROOTME_API_URL,
  timeout: 5000,
  headers: { Cookie: `api_key=${process.env.API_KEY}` },
  withCredentials: true,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true })
})

ConcurrencyManager(instance)

module.exports = instance

