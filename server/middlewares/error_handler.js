// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// A middleware to catch other middlewares errors and repackage them
// in JSON and with more readable error reports
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const { logoutRedirect } = __.require('controllers', 'auth/connection')

module.exports = function(err, req, res, next){
  // Repackaging errors generated by body-parser
  if ((err.name === 'SyntaxError') && err.message.startsWith('Unexpected token')) {
    return error_.bundle(req, res, 'invalid JSON body', 400)
  } else if (err.name === 'SessionError') {
    const { pathname } = req._parsedUrl
    return logoutRedirect(`/login?redirect=${pathname}`, req, res, next)
  } else {
    return error_.handler(req, res, err)
  }
}
