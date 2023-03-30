const logger = require('../utils/signale')
const url = require('url')
logger.log('cURL instantiated')

const getRandom = () => {
  return Math.random().toString(36).replace(/[^a-z]+/g, '').slice(0, 5)
}

const getCookie = () => {
  if (process.env.API_KEY_FIRST) return `api_key=${process.env.API_KEY_FIRST}`
  else if (process.env.SPIP_SESSION) return `spip_session=${process.env.SPIP_SESSION}`
  else return `api_key=${process.env.API_KEY}`
}

const { curly } = require('node-libcurl')
const { pause } = require('../utils/util')

const HEADERS_OBJ = {
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
  'accept-encoding': 'gzip, deflate, br',
  'accept-language': 'fr-FR,fr;q=0.9',
  'pragma': 'no-cache',
  'cache-control': 'no-cache',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'sec-fetch-user': '?1',
  'sec-gpc': '1',
  'upgrade-insecure-requests': '1',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.102 Safari/537.36',
  'cookie': `msg_history=explication_site_multilingue%3B; ${getCookie()}`
}

const baseUrl = process.env.ROOTME_API_URL.replace(/https?:\/\//, '')

const get = async (pathname, options) => {
  let hostname = baseUrl
  if (options?.customHostname) {
    hostname = options.customHostname
    delete options.customHostname
    if (Object.keys(options).length === 0) options = undefined
  }

  options ||= {}
  options.params ||= {}

  // Wtf ??
  if (hostname.startsWith('api.') && (pathname.startsWith('/challenges') || pathname.startsWith('/auteurs'))) {
    pathname = pathname = getRandom() + '_' + getRandom() + '_' + getRandom() + '/%2E%2E' + pathname
    options.params.os = getRandom() + getRandom() + getRandom()
  }

  const s = url.format({
    hostname,
    pathname: pathname || undefined,
    protocol: 'https:',
    query: options.params
  }).toString()
  // logger.log('GET : ', s)
  const optionalHeaders = options?.headers || {}
  const tmpHeaders = { ...HEADERS_OBJ, ...optionalHeaders }
  const headers = Object.entries(tmpHeaders).map(([k, v]) => `${k}: ${v}`)
  const opts = {
    timeoutMs: process.env.TIMEOUT_MS || 15000,
    followLocation: true,
    httpHeader: headers
  }
  const { statusCode, data } = await curly.get(s, opts)
  if (statusCode !== 200) {
    if (statusCode === 429) {
      logger.warn('Too many request, wait a bit')
      await pause(5000)
    }
    if (statusCode === 404) logger.warn('404')
    else logger.error('Error : ', statusCode)
    throw { code: statusCode }
  }
  return { data, statusCode }
}

module.exports = { get }

