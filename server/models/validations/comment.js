// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { pass, userId, transactionId } = require('./common')

module.exports = {
  pass,
  userId,
  transactionId,
  message(message){ return 0 < message.length && message.length < 5000 }
}
