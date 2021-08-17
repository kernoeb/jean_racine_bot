const { ConcurrencyManager } = require('axios-concurrency')
const axios = require('axios')
const logger = require('../utils/signale')

logger.log('Axios instantiated')

const instance = axios.create({
  baseURL: process.env.ROOTME_API_URL,
  timeout: 5000,
  headers: { Cookie: `api_key=${process.env.API_KEY}` },
  withCredentials: true
})

ConcurrencyManager(instance, 1)

module.exports = instance

