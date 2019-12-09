const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { authReq, authReqB, getUser, shouldNotGetHere, rethrowShouldNotGetHereErrors } = __.require('apiTests', 'utils/utils')
const { createTransaction } = require('../fixtures/transactions')
const { createItem } = require('../fixtures/items')
const endpoint = '/api/transactions?action=request'

describe('transactions:request', () => {
  it('should reject without id', async () => {
    try {
      const res = await authReq('post', endpoint, {})
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: item')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject without message', async () => {
    try {
      const item = await createItem()
      const res = await authReq('post', endpoint, { item: item._id })
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: message')
      err.statusCode.should.equal(400)
    }
  })

  it('should not request your own items', async () => {
    try {
      const item = await createItem()
      const res = await authReq('post', endpoint, {
        item: item._id,
        message: 'yo'
      })
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
      err.body.status_verbose.should.equal('not allowed with this item')
    }
  })

  it('should not request inventorying items', async () => {
    try {
      const item = await createItem()
      const res = await authReqB('post', endpoint, {
        item: item._id,
        message: 'yo'
      })
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
      err.body.status_verbose.should.equal("this item can't be requested")
    }
  })

  it('should not request inventorying items', async () => {
    const item = await createItem(getUser(), { listing: 'public', transaction: 'giving' })
    const res = await authReqB('post', endpoint, {
      item: item._id,
      message: 'yo'
    })
    res.transaction.state.should.equal('requested')
  })

  it('should create a transaction', async () => {
    const res = await createTransaction()
    const { transaction, userA, userB, userBItem } = res
    transaction.should.be.an.Object()
    transaction.item.should.equal(userBItem._id)
    transaction.requester.should.equal(userA._id)
    transaction.owner.should.equal(userB._id)
    const { snapshot } = transaction
    snapshot.item.entity.should.equal(userBItem.entity)
    snapshot.owner.username.should.equal(userB.username)
    snapshot.owner.picture.should.equal(userB.picture)
    snapshot.requester.username.should.equal(userA.username)
    snapshot.requester.picture.should.equal(userA.picture)
    snapshot.entity.image.should.equal(userBItem.snapshot['entity:image'])
    snapshot.entity.authors.should.equal(userBItem.snapshot['entity:authors'])
  })
})
