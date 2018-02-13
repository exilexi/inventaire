# A module to put the basis of an edition entity based on the results
# from dataseed. It tries to find the associated works and authors
# from Wikidata and Inventaire search (using searchWorkEntityByTitleAndAuthors)
# but if it fails to find the corresponding entities, it creates new ones.
# It assumes that any seed arriving here found no match to its ISBN

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
createEntity = require '../create_entity'
# It is simpler to use a consistent, recognizable mocked user id
# than to put exceptions everywhere
seedUserId = __.require('couch', 'hard_coded_documents').users.seed._id
workEntitiesCache = require './work_entity_search_deduplicating_cache'

# Working around circular dependencies
searchWorkEntityByTitleAndAuthors = null
lateRequire = ->
  searchWorkEntityByTitleAndAuthors = require './search_work_entity_by_title_and_authors'
setTimeout lateRequire, 0

# seed attributes:
# MUST have: title

module.exports = (seed)->
  { title, authors } = seed
  unless _.isNonEmptyString title
    return error_.reject 'missing title', 400, title

  title = title.trim()

  unless _.isArray authors
    return error_.reject 'missing authors', 400, authors

  authors = authors.map _.trim

  # unless a lang is explicitly passed, deduce it from the the ISBN groupLang
  lang = seed.lang or seed.groupLang or 'en'

  searchWorkEntityByTitleAndAuthors seed
  .then (workEntity)->
    if workEntity?
      _.log seed, "scaffolding from existing work entity: #{workEntity.uri}"
      workPromise = promises_.resolve workEntity
    else
      _.log seed, 'scaffolding from scratch'
      authorsPromises = createAuthorsEntities seed, lang
      workPromise = createWorkEntity seed, lang, authorsPromises

    workEntitiesCache.set seed, workPromise
    return workPromise

createAuthorsEntities = (seed, lang)->
  promises_.all seed.authors.map(CreateAuthorEntity(lang))

CreateAuthorEntity = (lang)-> (authorName)->
  labels = {}
  labels[lang] = authorName
  claims =
    'wdt:P31': [ 'wd:Q5' ]

  createEntity labels, claims, seedUserId
  .then _.Log('created author entity')
  .catch _.ErrorRethrow('createAuthorEntity err')

createWorkEntity = (seed, lang, authorsPromises)->
  labels = {}
  { title } = seed
  if _.isNonEmptyString(title) then labels[lang] = title
  claims =
    'wdt:P31': [ 'wd:Q571' ]

  authorsPromises
  .then (authors)->
    authorsIds = authors.map (author)-> "inv:#{author._id}"
    claims['wdt:P50'] = authorsIds
    return createEntity labels, claims, seedUserId
  .then _.Log('created work entity')
  .catch _.ErrorRethrow('createWorkEntity err')
