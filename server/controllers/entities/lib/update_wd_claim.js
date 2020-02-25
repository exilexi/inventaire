const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const getWdEntity = __.require('data', 'wikidata/get_entity')
const wdk = require('wikidata-sdk')
const wdEdit = require('wikidata-edit')
const wdOauth = require('./wikidata_oauth')
const properties = require('./properties/properties_values_constraints')

module.exports = async (user, id, property, oldVal, newVal) => {
  wdOauth.validate(user)

  if ((properties[property].datatype === 'entity') && _.isInvEntityUri(newVal)) {
    throw error_.new("wikidata entities can't link to inventaire entities", 400)
  }

  oldVal = dropPrefix(oldVal)
  newVal = dropPrefix(newVal)

  const [ propertyPrefix, propertyId ] = property.split(':')

  if (propertyPrefix !== 'wdt') {
    throw error_.newInvalid('property', propertyPrefix)
  }

  const oauth = wdOauth.getFullCredentials(user)

  if (newVal) {
    if (oldVal) {
      return updateClaim(oauth, id, propertyId, oldVal, newVal)
    } else {
      return addClaim(oauth, id, propertyId, newVal)
    }
  } else {
    return removeClaim(oauth, id, propertyId, oldVal)
  }
}

const addClaim = (oauth, id, propertyId, newVal) => wdEdit({ oauth }, 'claim/add')(id, propertyId, newVal)

const removeClaim = (oauth, id, propertyId, oldVal) => {
  return getClaimGuid(id, propertyId, oldVal)
  .then(guid => wdEdit({ oauth }, 'claim/remove')(guid))
}

const updateClaim = (oauth, id, propertyId, oldVal, newVal) => {
  return removeClaim(oauth, id, propertyId, oldVal)
  .then(() => addClaim(oauth, id, propertyId, newVal))
}

const getClaimGuid = (id, propertyId, oldVal) => {
  return getWdEntity([ id ])
  .then(entity => {
    const propClaims = entity.claims[propertyId]
    const simplifyPropClaims = wdk.simplify.propertyClaims(propClaims)
    const oldValIndex = simplifyPropClaims.indexOf(oldVal)
    const targetClaim = propClaims[oldValIndex]
    return targetClaim.id
  })
}

const dropPrefix = value => {
  if (_.isEntityUri(value)) {
    return value.replace('wd:', '')
  } else {
    return value
  }
}
