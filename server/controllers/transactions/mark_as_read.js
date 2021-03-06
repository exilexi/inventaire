// Mark the whole transaction as read

const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const transactions_ = require('./lib/transactions')
const sanitize = __.require('lib', 'sanitize/sanitize')
const { verifyRightToInteract } = require('./lib/rights_verification')

const sanitization = {
  id: {}
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { id, reqUserId } = params
    return transactions_.byId(id)
    .then(verifyRightToInteract.bind(null, reqUserId))
    .then(transactions_.markAsRead.bind(null, reqUserId))
    .then(responses_.Ok(res))
  })
  .catch(error_.Handler(req, res))
}
