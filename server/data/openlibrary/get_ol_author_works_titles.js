
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const requests_ = __.require('lib', 'requests')
const cache_ = __.require('lib', 'cache')
const { oneMonth } = __.require('lib', 'times')

const endpoint = 'https://openlibrary.org'
const base = `${endpoint}/search.json`
const headers = { accept: '*/*' }

module.exports = olId => {
  const key = `ol:author-works-titles:${olId}`
  return cache_.get({ key, fn: getAuthorWorksTitles.bind(null, olId), timespan: 3 * oneMonth })
}

const getAuthorWorksTitles = olId => {
  _.info(olId, 'olId')
  const url = `${base}?author=${olId}`
  return requests_.get({ url, headers })
  .then(res => res.docs
  .map(result => ({
    title: result.title_suggest,
    url: endpoint + result.key
  })))
}