const __ = require('config').universalPath
const getByAccessLevel = require('./get_by_access_level')
const groups_ = __.require('controllers', 'groups/lib/groups')
const getInventoryAccessLevel = require('./get_inventory_access_level')

// Return what the reqUserId user is allowed to see from a user or a group inventory
module.exports = {
  byUser: async (userId, reqUserId) => {
    const accessLevel = await getInventoryAccessLevel(userId, reqUserId)
    return getByAccessLevel[accessLevel](userId)
  },

  byGroup: async (groupId, reqUserId) => {
    const allGroupMembers = await groups_.getGroupMembersIds(groupId)
    if (reqUserId && allGroupMembers.includes(reqUserId)) {
      return getByAccessLevel.network(allGroupMembers)
    } else {
      return getByAccessLevel.public(allGroupMembers)
    }
  }
}
