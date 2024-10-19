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

const PROXY_LIST = process.env.ACTIVATE_PROXIES == 1 ? process.env.PROXY_LIST_URL : null
if (PROXY_LIST) {
  logger.info('Proxies activated:', PROXY_LIST)
}
let proxies_list = []

const refillProxies = async () => {
  proxies_list = await curly.get(PROXY_LIST)
  proxies_list = proxies_list.data.replaceAll('\r\n', '\n').split('\n')
}

const getProxy = async () => {
  if (proxies_list.length === 0) {
    logger.info('No proxies left, refilling')
    await refillProxies()
  }
  const proxy = proxies_list.pop()
  return proxy
}

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

  if (hostname && pathname && hostname.startsWith('api.') && (pathname.startsWith('/challenges') || pathname.startsWith('/auteurs'))) {
    pathname = `${getRandom()}_${getRandom()}_${getRandom()}/%2E%2E${pathname}`
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
  const proxy = PROXY_LIST ? process.env.PROXY || await getProxy() : undefined
  const opts = {
    timeoutMs: process.env.TIMEOUT_MS || 5000,
    followLocation: true,
    httpHeader: headers
  }
  if (proxy) {
    opts.proxy = proxy
  }
  try {
    const { statusCode, data } = await curly.get(s, opts)
    if (statusCode !== 200) {
      if (statusCode === 429) {
        logger.warn('Too many request, wait a bit')
        await pause(5000)
      }
      if (statusCode === 404) logger.warn('404')
      if (statusCode === 35)
      {
        logger.warn('SSL connect error, retrying')
        // If this error happens, it means that we have been banned
        // So we wait 5 minutes before retrying
        // I added 10 seconds to be sure that the server is ready
        await pause(1000 * 60 * 5 + 10000)
      }
      else logger.error('Error : ', statusCode)
      throw { code: statusCode }
    }
    return { data, statusCode }
  } catch (e) {
    if (PROXY_LIST) {
      if (e.code === 28) {
        logger.warn('Timeout, retrying with another proxy')
        return await get(pathname, options)
      }
      if (e.code === 7) {
        logger.warn('Connection refused, retrying with another proxy')
        return await get(pathname, options)
      }
      if (e.code === 56) {
        logger.warn('Failure receiving network data, retrying with another proxy')
        return await get(pathname, options)
      }
    }
    throw e
  }

}

module.exports = { get }

