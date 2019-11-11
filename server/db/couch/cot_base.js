// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
const CONFIG = require('config')
const __ = CONFIG.universalPath

const params = {
  hostname: CONFIG.db.host,
  port: CONFIG.db.port,
  auth: CONFIG.db.auth(),
  debug: CONFIG.db.debug
}

if (CONFIG.db.protocol === 'https') {
  params.ssl = true
}

module.exports = require('blue-cot')(params)
