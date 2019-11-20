
let responses_
const __ = require('config').universalPath
const assert_ = __.require('utils', 'assert_types')

module.exports = (responses_ = {
  // returns a function triggering a standard confirmation response
  ok: (res, status = 200) => {
    res.status(status)
    return responses_.send(res, { ok: true })
  },

  Ok: (res, status) => responses_.ok.bind(null, res, status),

  okWarning: (res, category, warning, status = 200) => {
    responses_.addWarning(res, category, warning)
    res.status(status)
    return responses_.send(res, { ok: true })
  },

  // FROM: .then (users)-> res.json { users }
  // TO: .then _.Wrap(res, 'users')
  Wrap: (res, key) => {
    return data => {
      const obj = {}
      obj[key] = data
      return responses_.send(res, obj)
    }
  },

  send: (res, data) => {
    assert_.object(res)
    assert_.object(data)
    setWarnings(res, data)
    return res.json(data)
  },

  Send: res => responses_.send.bind(null, res),

  addWarning: (res, category, message) => {
    if (!res.warnings) { res.warnings = {} }
    if (!res.warnings[category]) { res.warnings[category] = [] }
    return res.warnings[category].push(message)
  }
})

const setWarnings = (res, data) => {
  if (res.warnings) data.warnings = res.warnings
}