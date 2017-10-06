__ = require('config').universalPath
_ = __.require 'builders', 'utils'
radio = __.require 'lib', 'radio'
User = __.require 'models', 'user'

module.exports = (user_)->
  radio.on 'item:update', (previousItem, updateItem)->
    userId = previousItem?.owner or updateItem?.owner
    previousListing = previousItem?.listing
    newListing = updateItem?.listing
    # No update needed
    if previousListing is newListing then return
    # TODO: debounce this request so that parallele updates of a same user
    # doesn't trigger an update conflict
    user_.db.update userId, updateSnapshotItemsCounts(previousListing, newListing)
    .catch _.Error('user updateSnapshotItemsCounts err')

updateSnapshotItemsCounts = (previousListing, newListing)-> (user)->
  # Item updated or deleted
  if previousListing? then decrement user.snapshot[previousListing]
  # Item created or updated
  if newListing? then increment user.snapshot[newListing]

  return user

increment = (snapshotSection)->
  snapshotSection['items:count'] += 1
  snapshotSection['items:last-add'] = Date.now()
  return

decrement = (snapshotSection)->
  snapshotSection['items:count'] -= 1
  return
