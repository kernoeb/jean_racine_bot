const curl = require('../utils/curl')
const mongoose = require('./mongoose')
const logger = require('../utils/signale')

const hostname = process.env.ROOTME_URL.replace(/https?:\/\//, '')

function getBase64Image(data) {
  return Buffer.from(data).toString('base64')
}

/**
 * Get image from root-me
 * @param {string} url - URL to get image from
 * @param {string} rootmeId - Root-me ID
 * @param {boolean} asImage - Return image as Buffer
 * @returns {Promise<any|string>}
 */
async function getImage(url, rootmeId, asImage) {
  const { data } = await curl.get(url, { customHostname: hostname })
  if (data.toString().includes('<html')) throw new Error('Not an image')

  if (data) {
    await mongoose.models.profilepictures.updateOne(
      { rootmeId },
      { $set: { image: getBase64Image(data) } },
      { upsert: true }
    ).catch(err => logger.error(err)) // non blocking
  }

  return asImage ? data : `${process.env.ROOTME_URL}${url}`
}

module.exports = {
  /**
   * Get profile picture from root-me
   * @param {string} rootmeId - Root-me ID
   * @param {boolean} asImage - Return image as Buffer
   * @returns {Promise<Buffer|*|string|null>}
   */
  async getProfilePicture(rootmeId, asImage = false) {
    try { return await getImage(`/IMG/logo/auton${rootmeId}.jpg`, rootmeId, asImage) } catch {}
    try { return await getImage(`/IMG/logo/auton${rootmeId}.png`, rootmeId, asImage) } catch {}
    try { return await getImage(`/IMG/logo/auton${rootmeId}.gif`, rootmeId, asImage) } catch {}

    // Try to use cache
    if (asImage) {
      try {
        const { image } = await mongoose.models.profilepictures.findOne({ rootmeId }, { image: 1, _id: 0 })
        if (image && image.length) {
          logger.debug(`Using cache for ${rootmeId}`)
          return Buffer.from(image, 'base64')
        }
      } catch (err) {}
    }

    // Try to use default image
    try { return await getImage('/IMG/logo/auton0.png', rootmeId, asImage) } catch {}

    return null
  }
}
