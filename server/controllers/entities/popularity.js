/* eslint-disable
    implicit-arrow-linebreak,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const sanitize = __.require('lib', 'sanitize/sanitize')
const { Promise } = __.require('lib', 'promises')
const getEntitiesPopularity = require('./lib/get_entities_popularity')

const sanitization = {
  uris: {},
  refresh: { optional: true }
}

module.exports = (req, res, next) => // TODO: when passing a refresh flag, return the old popularity value
// instead of the default value, as getEntitiesPopularity would do
// for Wikidata entities
  sanitize(req, res, sanitization)
.then((params) => {
  const { uris, refresh } = params
  return getEntitiesPopularity(uris, refresh)}).then(responses_.Wrap(res, 'scores'))
.catch(error_.Handler(req, res))
