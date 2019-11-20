
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const delayedInit = setTimeout
const { initDelay, disabled } = CONFIG.mailer

module.exports = () => {
  initMailer()
  return initActivitySummary()
}

const initMailer = () => {
  if (disabled) return _.warn('mailer disabled')

  _.info('mailer enabled')

  // loading mailer dependencies slightly later
  // due to its lower priority at startup
  return delayedInit(initMailerEventListeners, initDelay)
}

const initMailerEventListeners = () => {
  const radio = __.require('lib', 'radio')
  const sendEmail = require('./send_email')
  const debounceEmails = require('./debounce_emails')
  const initDebouncedEmailsCrawler = require('./debounced_emails_crawler')

  radio.on('validation:email', sendEmail.validationEmail)
  radio.on('reset:password:email', sendEmail.resetPassword)
  radio.on('notify:friend:request:accepted', sendEmail.friendAcceptedRequest)
  radio.on('notify:friendship:request', sendEmail.friendshipRequest)

  radio.on('group:invite', sendEmail.group.bind(null, 'invite'))
  radio.on('group:acceptRequest', sendEmail.group.bind(null, 'acceptRequest'))

  radio.on('received:feedback', sendEmail.feedback)

  radio.on('send:email:invitations', sendEmail.friendInvitations)
  radio.on('send:group:email:invitations', sendEmail.groupInvitations)

  initDebouncedEmailsCrawler()

  radio.on('transaction:request', debounceEmails.transactionUpdate)
  radio.on('transaction:update', debounceEmails.transactionUpdate)
  radio.on('transaction:message', debounceEmails.transactionUpdate)
  return _.info('mailer events listeners ready!')
}

const initActivitySummary = () => {
  if (CONFIG.activitySummary.disabled) {
    return _.warn('activity summary disabled')
  }

  _.info('activity summary enabled')
  const activitySummary = require('./activity_summary/activity_summary')
  return delayedInit(activitySummary, initDelay)
}