
// An endpoint to get entities history as snapshots and diffs
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const patches_ = require('./lib/patches')

module.exports = (req, res) => {
  const { id } = req.query

  if (!_.isInvEntityId(id)) {
    return error_.bundleInvalid(req, res, 'id', id)
  }

  return patches_.getSnapshots(id)
  .then(responses_.Wrap(res, 'patches'))
  .catch(error_.Handler(req, res))
}