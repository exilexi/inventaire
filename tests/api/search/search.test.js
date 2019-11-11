// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const should = require('should')
const faker = require('faker')
const { Promise } = __.require('lib', 'promises')
const { nonAuthReq, authReq, undesiredRes, undesiredErr, getUser } = require('../utils/utils')
const randomString = __.require('lib', './utils/random_string')
const { createWork, createHuman, createSerie, humanName, randomLabel, createEditionFromWorks } = require('../fixtures/entities')
const { getRefreshedPopularityByUris } = require('../utils/entities')

describe('search:global', () => {
  it('should reject empty searches', (done) => {
    nonAuthReq('get', '/api/search?lang=fr&types=works')
    .then(undesiredRes(done))
    .catch((err) => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('missing parameter in query: search')
      return done()}).catch(undesiredErr(done))

  })

  it('should reject search without types', (done) => {
    nonAuthReq('get', '/api/search?search=yo&lang=fr')
    .then(undesiredRes(done))
    .catch((err) => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('missing parameter in query: types')
      return done()}).catch(undesiredErr(done))

  })

  it('should reject invalid types', (done) => {
    search('da', 'yo')
    .then(undesiredRes(done))
    .catch((err) => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid types: da')
      return done()}).catch(undesiredErr(done))

  })

  it('should return a wikidata human', (done) => {
    search('humans', 'Gilles Deleuze')
    .then((results) => {
      results.should.be.an.Array()
      results.forEach(result => result.type.should.equal('humans'))
      _.map(results, 'id').includes('Q184226').should.be.true()
      return done()}).catch(undesiredErr(done))

  })

  it('should return a local human', (done) => {
    const label = randomString(5)
    createHuman({ labels: { fr: label } })
    // Let the time for Elastic Search indexation
    .delay(4000)
    .then(entity => search('humans', label)
    .then((results) => {
      results.should.be.an.Array()
      results.forEach(result => result.type.should.equal('humans'))
      _.map(results, 'id').includes(entity._id).should.be.true()
      return done()
    })).catch(undesiredErr(done))

  })

  it('should return a local work', (done) => {
    const label = randomString(5)
    createWork({ labels: { fr: label } })
    // Let the time for Elastic Search indexation
    .delay(4000)
    .then(entity => search('works', label)
    .then((results) => {
      results.should.be.an.Array()
      results.forEach(result => result.type.should.equal('works'))
      _.map(results, 'id').includes(entity._id).should.be.true()
      return done()
    })).catch(undesiredErr(done))

  })

  it('should return a wikidata work', (done) => {
    search('works', 'Les Misérables')
    .then((results) => {
      results.should.be.an.Array()
      results.forEach(result => result.type.should.equal('works'))
      _.map(results, 'id').includes('Q180736').should.be.true()
      return done()}).catch(undesiredErr(done))

  })

  it('should return a local serie', (done) => {
    const label = randomLabel()
    createSerie({ labels: { fr: label } })
    // Let the time for Elastic Search indexation
    .delay(1000)
    .then(entity => search('series', label)
    .then((results) => {
      results.should.be.an.Array()
      results.forEach(result => result.type.should.equal('series'))
      _.map(results, 'id').includes(entity._id).should.be.true()
      return done()
    })).catch(undesiredErr(done))

  })

  it('should return a wikidata serie', (done) => {
    search('series', 'Harry Potter')
    .then((results) => {
      results.should.be.an.Array()
      results.forEach(result => result.type.should.equal('series'))
      _.map(results, 'id').includes('Q8337').should.be.true()
      return done()}).catch(undesiredErr(done))

  })

  it('should return a user', (done) => {
    getUser()
    .delay(1000)
    .then(user => search('users', user.username)
    .then((results) => {
      results.should.be.an.Array()
      results.forEach(result => result.type.should.equal('users'))
      _.map(results, 'id').includes(user._id).should.be.true()
      return done()
    })).catch(undesiredErr(done))

  })

  it('should return a group', (done) => {
    const name = `group ${faker.lorem.word}`
    authReq('post', '/api/groups?action=create', { name })
    .delay(1000)
    .then(group => search('groups', name)
    .then((results) => {
      results.should.be.an.Array()
      results.forEach(result => result.type.should.equal('groups'))
      _.map(results, 'id').includes(group._id).should.be.true()
      return done()
    })).catch(undesiredErr(done))

  })

  it('should not return a private group unless requester is a member', (done) => {
    const name = `group ${faker.lorem.word}`
    authReq('post', '/api/groups?action=create', { name, searchable: false })
    .delay(1000)
    .then(group => search('groups', name)
    .then((results) => {
      _.map(results, 'id').includes(group._id).should.be.false()
      // The same request but authentified with a group member account
      // should find the group
      return authReq('get', `/api/search?search=${name}&types=groups&lang=fr`)
      .then((res) => {
        ({ results } = res)
        _.map(results, 'id').includes(group._id).should.be.true()
        return done()
      })
    })).catch(undesiredErr(done))

  })

  it('should sort entities by global score', (done) => {
    const fullMatchLabel = randomString(15)
    const partialMatchLabel = fullMatchLabel + ' a'
    createWork({ labels: { fr: partialMatchLabel } })
    .then(work => Promise.all([
      createEditionFromWorks(work),
      createWork({ labels: { fr: fullMatchLabel } })
    ])
    // trigger a popularity refresh to avoid getting the default score on
    // the search hereafter
    .then(() => getRefreshedPopularityByUris(work.uri))
    .delay(1000)
    .then(() => {
      const workWithEditionUri = work.uri
      return search('works', fullMatchLabel)
      .then((results) => {
        const firstResultUri = results[0].uri
        firstResultUri.should.equal(workWithEditionUri)
        return done()
      })
    })).catch(undesiredErr(done))

  })

  return it('should return a global score boosted by a logarithmic popularity', (done) => {
    const workLabel = randomLabel()
    createWork({ labels: { fr: workLabel } })
    .then((work) => {
      const workEditionsCreation = [
        createEditionFromWorks(work),
        createEditionFromWorks(work)
      ]
      return Promise.all(workEditionsCreation)
      // trigger a popularity refresh to avoid getting the default score on
      // the search hereafter
      .then(works => getRefreshedPopularityByUris(_.map(works, 'uri')))
      .delay(2000)
      .then(() => search('works', workLabel)
      .then((results) => {
        const firstEntityResult = results[0]
        const popularity = workEditionsCreation.length
        const boostLimit = firstEntityResult.lexicalScore * popularity
        firstEntityResult.globalScore.should.be.below(boostLimit)
        return done()
      }))}).catch(undesiredErr(done))

  })
})

var search = function(types, search){
  search = encodeURIComponent(search)
  return nonAuthReq('get', `/api/search?search=${search}&types=${types}&lang=fr&limit=50`)
  .get('results')
}
