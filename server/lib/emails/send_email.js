
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')

const helpers_ = require('./helpers')
const transporter_ = require('./transporter')
const email_ = require('./email')

module.exports = {
  validationEmail: (userData, token) => {
    const email = email_.validationEmail(userData, token)
    return transporter_.sendMail(email)
    .catch(_.Error('validationEmail'))
  },

  resetPassword: (userData, token) => {
    const email = email_.resetPassword(userData, token)
    return transporter_.sendMail(email)
    .catch(_.Error('resetPassword'))
  },

  friendAcceptedRequest: (userToNotify, newFriend) => {
    return helpers_.getUsersByIds(userToNotify, newFriend)
    .then(email_.friendAcceptedRequest)
    .then(transporter_.sendMail)
    .catch(helpers_.catchDisabledEmails)
    .catch(Err('friendAcceptedRequest', userToNotify, newFriend))
  },

  friendshipRequest: (userToNotify, requestingUser) => {
    return helpers_.getUsersByIds(userToNotify, requestingUser)
    .then(email_.friendshipRequest)
    .then(transporter_.sendMail)
    .catch(helpers_.catchDisabledEmails)
    .catch(Err('friendshipRequest', userToNotify, requestingUser))
  },

  group: (action, groupId, actingUserId, userToNotifyId) => {
    return helpers_.getGroupAndUsersData(groupId, actingUserId, userToNotifyId)
    .then(email_.group.bind(null, action))
    .then(transporter_.sendMail)
    .catch(helpers_.catchDisabledEmails)
    .catch(Err(`group ${action}`, actingUserId, userToNotifyId))
  },

  feedback: (subject, message, user, unknownUser, uris, context) => {
    const email = email_.feedback(subject, message, user, unknownUser, uris, context)
    return transporter_.sendMail(email)
    .catch(_.Error('feedback'))
  },

  friendInvitations: (user, emailAddresses, message) => {
    const emailFactory = email_.FriendInvitation(user, message)
    return sendSequentially(emailAddresses, emailFactory, 'friendInvitations')
  },

  groupInvitations: (user, group, emailAddresses, message) => {
    const emailFactory = email_.GroupInvitation(user, group, message)
    return sendSequentially(emailAddresses, emailFactory, 'groupInvitations')
  }
}

const sendSequentially = (emailAddresses, emailFactory, label) => {
  // Do not mutate the original object
  const addresses = _.clone(emailAddresses)
  const sendNext = () => {
    const nextAddress = addresses.pop()
    if (!nextAddress) return

    _.info(nextAddress, `${label}: next. Remaining: ${addresses.length}`)

    const email = emailFactory(nextAddress)
    return transporter_.sendMail(email)
    .catch(_.Error(`${label} (address: ${nextAddress} err)`))
    // Wait to lower risk to trigger any API quota issue from the email service
    .delay(500)
    // In any case, send the next
    .then(sendNext)
  }

  return sendNext()
}

const Err = (label, user1, user2) => _.Error(`${label} email fail for ${user1} / ${user2}`)