# A module to look for works labels occurrences in an author's Wikipedia articles.

__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
getWikipediaArticle = __.require 'data', 'wikipedia/get_article'
getBnfAuthorWorksTitles = __.require 'data', 'bnf/get_bnf_author_works_titles'
getEntityByUri = __.require 'controllers', 'entities/lib/get_entity_by_uri'
{ isWdEntityUri } = __.require 'lib', 'wikidata/wikidata'

# - worksLabels: labels from works of an author suspected
#   to be the same as the wdAuthorUri author
# - worksLabelsLangs: those labels language, indicating which Wikipedia editions
#   should be checked
module.exports = (wdAuthorUri, worksLabels, worksLabelsLangs)->
  _.type wdAuthorUri, 'string'
  _.type worksLabels, 'array'
  _.type worksLabelsLangs, 'array'

  unless isWdEntityUri wdAuthorUri then return promises_.resolve []

  # Filter-out labels that are too short, as it could generate false positives
  worksLabels = worksLabels.filter (label)-> label.length > 5

  if worksLabels.length is 0 then return promises_.resolve []

  # get Wikipedia article title from URI
  getEntityByUri wdAuthorUri
  .then (authorEntity)->
    # Known case: entities tagged as 'missing' or 'meta'
    unless authorEntity.sitelinks? then return []

    promises_.all [
      getWikipediaOccurrences authorEntity, worksLabels, worksLabelsLangs
      getBnfOccurrences authorEntity, worksLabels
    ]
  .then _.flatten
  .then _.compact
  .catch (err)->
    _.error err, 'has works labels occurrence err'
    return []

getWikipediaOccurrences = (authorEntity, worksLabels, worksLabelsLangs)->
  promises_.all getMostRelevantWikipediaArticles(authorEntity, worksLabelsLangs)
  .map createOccurrences(worksLabels)

getMostRelevantWikipediaArticles = (authorEntity, worksLabelsLangs)->
  { sitelinks, originalLang } = authorEntity

  return _.uniq worksLabelsLangs.concat([ originalLang, 'en' ])
  .map (lang)->
    title = sitelinks["#{lang}wiki"]
    if title? then return { lang, title }
  .filter _.identity
  .map getWikipediaArticle

getBnfOccurrences = (authorEntity, worksLabels)->
  bnfIds = authorEntity.claims['wdt:P268']
  # Discard entities with several ids as one of the two
  # is wrong and we can't know which
  if bnfIds?.length isnt 1 then return false
  getBnfAuthorWorksTitles bnfIds[0]
  .map createOccurrences(worksLabels)

createOccurrences = (worksLabels)->
  worksLabelsPattern = new RegExp(worksLabels.join('|'), 'gi')
  return (article)->
    matchedTitles = _.uniq article.quotation.match(worksLabelsPattern)
    unless matchedTitles.length > 0 then return false
    return { url: article.url, matchedTitles }