_ = require('config').root.require('builders', 'utils')
Promise = require 'bluebird'
breq = require 'bluereq'

requests =
  get: (url)-> breq.get(url).then (res)-> res.body
  post: (params)-> breq.post(params).then (res)-> res.body


pluckSettled = (results)-> _.pluck results, '_settledValue'

promisesHandlers =
  Promise: Promise
  reject: Promise.reject.bind(Promise)
  resolve: Promise.resolve.bind(Promise)
  settle: (promises)->
    Promise.settle(promises).then pluckSettled


errorsHandlers =
  catchNotFound: (err)->
    if err?.notFound then return
    else throw err


module.exports = _.extend {}, requests, promisesHandlers, errorsHandlers