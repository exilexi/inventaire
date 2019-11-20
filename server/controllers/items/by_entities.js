const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const items_ = __.require('controllers', 'items/lib/items')
const relations_ = __.require('controllers', 'relations/lib/queries')
const error_ = __.require('lib', 'error/error')
const promises_ = __.require('lib', 'promises')
const sanitize = __.require('lib', 'sanitize/sanitize')
const responses_ = __.require('lib', 'responses')
const { addAssociatedData, Paginate } = require('./lib/queries_commons')

const sanitization = {
  uris: {},
  limit: { optional: true },
  offset: { optional: true }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(getEntitiesItems)
  .then(addAssociatedData)
  .then(responses_.Send(res))
  .catch(error_.Handler(req, res))
}

const getEntitiesItems = page => {
  const { uris, reqUserId } = page

  return promises_.all([
    getUserItems(reqUserId, uris),
    getNetworkItems(reqUserId, uris),
    items_.publicByEntities(uris)
  ])
  .spread((userItems, networkItems, publicItems) => {
    // Only add user and network keys for the authorized endpoint
    if (reqUserId != null) {
      const dedupPublicItems = deduplicateItems(userItems, networkItems, publicItems)
      return userItems.concat(networkItems).concat(dedupPublicItems)
    } else {
      return publicItems
    }
  })
  .then(Paginate(page))
}

const getUserItems = (reqUserId, uris) => {
  if (reqUserId == null) return []

  return items_.byOwnersAndEntitiesAndListings([ reqUserId ], uris, 'user', reqUserId)
}

const getNetworkItems = (reqUserId, uris) => {
  if (reqUserId == null) return []

  return relations_.getUserFriendsAndCoGroupsMembers(reqUserId)
  .then(networkUsersIds => items_.byOwnersAndEntitiesAndListings(networkUsersIds, uris, 'network', reqUserId))
}

const deduplicateItems = (userItems, networkItems, publicItems) => {
  const userAndNetworkItemsIds = userItems.map(getId).concat(networkItems.map(getId))

  return publicItems
  .filter(item => !userAndNetworkItemsIds.includes(item._id))
}

const getId = _.property('_id')
