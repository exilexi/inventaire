__ = require('config').universalPath
_ = __.require 'builders', 'utils'
getEntitiesByUris = require './get_entities_by_uris'

# Get only the entity formatted doc you needs instead of an object
# with entities and redirects
module.exports = (params)->
  { uri, refresh, dry } = params
  uris = [ uri ]
  getEntitiesByUris { uris, refresh, dry }
  .then (res)-> _.values(res.entities)[0]
