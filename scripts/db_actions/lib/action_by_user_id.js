const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const ActionByInput = require('./action_by_input')

const [ userId ] = Array.from(process.argv.slice(2))

_.log(userId, 'userId')

if (!_.isUserId(userId)) { throw new Error('invalid userId') }

module.exports = ActionByInput(userId)
