
const CONFIG = require('config')
const __ = CONFIG.universalPath
const requests_ = __.require('lib', 'requests')
const allDbsUrl = `${CONFIG.db.fullHost()}/_all_dbs`

module.exports = suffix => requests_.get(allDbsUrl)
.filter(isMatchingDatabase(suffix))

const isMatchingDatabase = suffix => {
  const patternString = (suffix != null) ? `^\\w+-${suffix}$` : '^\\w+$'
  const dbNamePattern = new RegExp(patternString)

  return dbName => {
    // Filtering-out _replicator and _users
    if (dbName[0] === '_') return false
    return dbName.match(dbNamePattern)
  }
}