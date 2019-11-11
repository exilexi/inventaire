// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Keep the user snapshot data about the state of her items updated
// taking care of avoiding edit conflicts on the user document when several items
// are created/edited in a short period of time

const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const radio = __.require('lib', 'radio')
const updateSnapshotItemsCounts = require('./update_snapshot_items_counts')
const { itemsCountDebounceTime:delay } = CONFIG
const totalCount = 0
const debounceCount = 0

module.exports = function() {
  const debouncedUpdaters = {}

  const itemsCountsUpdater = userId => (function() {
    // When it gets to be called, remove the lazy updater
    // to prevent blocking memory undefinitely
    delete debouncedUpdaters[userId]
    return updateSnapshotItemsCounts(userId)
    .catch(_.Error('user updateSnapshotItemsCounts err'))
  })

  return radio.on('user:inventory:update', (userId) => {
    // Creating a personnalized debouncer as a global debounce would be delayed
    // undefinitely "at scale"
    if (!debouncedUpdaters[userId]) { debouncedUpdaters[userId] = _.debounce(itemsCountsUpdater(userId), delay) }
    return debouncedUpdaters[userId]()
  })
}
