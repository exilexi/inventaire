__ = require('config').universalPath
_ = __.require 'builders', 'utils'
mergeEntities = __.require 'controllers', 'entities/lib/merge_entities'
{ _id: reconcilerUserId } = __.require('couch', 'hard_coded_documents').users.reconciler
{ prefixifyInv } = __.require 'controllers', 'entities/lib/prefix'
areTrustedOccurences = require './are_trusted_occurences'
# Merge if enough trust between the suspect and a suggestion
# If confidence is too low or several suggestions are trusted,
# return best suggestions for task creation

module.exports = (suspect, workLabelsByLang)-> (suggestions)->
  if suggestions.length is 0 then return []
  if authorNameInWorkTitles(suspect.labels, workLabelsByLang) then return suggestions
  { uri : suspectUri } = suspect
  # get suggestions with at least 2 occurences from trustworthy domains
  trustedSuggestions = suggestions.filter (sug)-> areTrustedOccurences(sug.occurrences)
  if trustedSuggestions.length is 1
    return mergeSuggestion suspectUri, trustedSuggestions[0].uri
  occurrencedSuggestions = filterIfOccurences suggestions

  # cannot merge if several suggestions have occurences
  if occurrencedSuggestions.length > 1 then return occurrencedSuggestions
  uniqSuggestion = occurrencedSuggestions[0]
  # merge when title is long enough
  if canBeAutomerged uniqSuggestion
    return mergeSuggestion suspectUri, uniqSuggestion.uri
  occurrencedSuggestions

mergeSuggestion = (suspectUri, suggestionUri)->
  mergeEntities reconcilerUserId, suspectUri, suggestionUri
  .then -> []

filterIfOccurences = (suggestions)->
  suggestions.filter (sug)-> sug.occurrences.length > 0

authorNameInWorkTitles = (authorLabels, workLabelsByLang)->
  # when author name and work title are the same, occurences can not be relevant
  # ie. on wikipedia, work titles will be confused with authors name page
  workLabels = _.values workLabelsByLang
  for authorLabel in _.values(authorLabels)
    for workLabel in workLabels
      if workLabel.match(authorLabel)? then return true

canBeAutomerged = (suggestion)->
  matchedTitles =  _.flatten _.map(suggestion.occurrences, 'matchedTitles')
  longTitles = matchedTitles.filter isLongTitle
  return longTitles.length > 0

isLongTitle = (title)-> title.length > 12
