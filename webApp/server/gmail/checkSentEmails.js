import uniq from 'lodash/uniq'
import uniqBy from 'lodash/uniqBy'
import flatten from 'lodash/flatten'
import addr from 'email-addresses'

import { isAccessRevokedError } from './accessRevoked'
import User from '../models/User'
import Payment from '../models/Payment'
import { EMAIL_QUESTION_FROM_ADDRESS } from '../constants'
import logger from '../log'
import * as api from './api'

const TEST_FROM_CLI = !!process.env.TEST_FROM_CLI

async function getSentEmails({ user, oauth2Client }) {
  let sentMessages = []
  let historyList
  let lastHistoryId

  do {
    // eslint-disable-next-line no-await-in-loop
    historyList = await api.getHistoryList({
      appUserId: user.id,
      userId: 'me',
      startHistoryId: user.gmailHistoryStartId,
      labelId: 'SENT',
      maxResults: 1000,
      pageToken: (historyList && historyList.nextPageToken) || undefined,
      auth: oauth2Client
    })

    if (historyList.history) {
      sentMessages = sentMessages.concat(historyList.history.map(h => h.messages || []))

      lastHistoryId = historyList.history[historyList.history.length - 1].id
    }

    if (historyList.historyId) {
      lastHistoryId = historyList.historyId
    }
  } while (historyList.nextPageToken)

  sentMessages = uniqBy(flatten(sentMessages), 'id')

  return { sentMessages, lastHistoryId }
}

async function isSentToCustomer({ user, message, oauth2Client }) {
  const dev = process.env.NODE_ENV !== 'production'

  const detail = await api.getMessage({
    appUserId: user.id,
    userId: 'me',
    id: message.id,
    auth: oauth2Client
  })

  // if email did not sent by mentor
  if (detail.labelIds.indexOf('SENT') === -1) {
    return false
  }

  let sentTo

  for (let i = 0; i < detail.payload.headers.length; i += 1) {
    const h = detail.payload.headers[i]
    if (h.name === 'To') {
      sentTo = h.value
      break
    }
  }

  const paymentCount = await Payment.find({
    userId: user.id,
    'stripeCustomer.email': addr.parseOneAddress(sentTo).address,
    'email.isSent': true,
    'stripeCustomer.livemode': !dev, // check only test users on dev
    isCardDeclined: false,
    isCharged: false
  }).count()

  return paymentCount > 0
}

async function checkEmailAndCharge({ message, user, oauth2Client }) {
  const dev = process.env.NODE_ENV !== 'production'

  try {
    if (!await isSentToCustomer({ message, user, oauth2Client })) {
      return
    }

    // getting replied email
    const detail = await api.getMessage({
      appUserId: user.id,
      userId: 'me',
      id: message.threadId,
      auth: oauth2Client
    })

    const email = {}

    detail.payload.headers.forEach(h => {
      if (['Subject', 'From', 'To', 'Message-ID'].indexOf(h.name) === -1) {
        return
      }

      email[h.name.toLowerCase()] = h.value
    })

    // if not from us, skip it
    if (addr.parseOneAddress(email.from).address !== EMAIL_QUESTION_FROM_ADDRESS) {
      return
    }

    // get original message id (<id@email.amazonses.com> => id)
    const messageId = addr.parseOneAddress(email['message-id']).local

    const payment = await Payment.findOne(
      {
        userId: user.id,
        'email.messageId': messageId,
        'email.isSent': true,
        'stripeCustomer.livemode': !dev, // check only test users on dev
        isCardDeclined: false,
        isCharged: false
      },
      'id userId stripeCustomer chargeFailedCount createdAt amount'
    )

    if (dev) {
      logger.info(detail.id, detail.historyId)
      logger.info(email)
      logger.info((payment && payment.id) || null)
    }

    // payment not found skip
    if (!payment) {
      return
    }

    const now = new Date()
    payment.update({ $set: { 'email.gmailId': detail.id, repliedAt: now } }).exec()

    user.calculateAverageResponseTime({ askedAt: payment.createdAt, repliedAt: now })

    try {
      await payment.charge({ user })
      logger.info('charged')

      api
        .modifyMessage({
          userId: 'me',
          id: detail.id,
          resource: {
            addLabelIds: [user.gmailPaidLabelId],
            removeLabelIds: [user.gmailCardDeclinedLabelId, user.gmailVerifiedLabelId]
          },
          auth: oauth2Client
        })
        .then(() => {
          logger.info('changed email label')
        })
        .catch(err2 => logger.error('Error while changing label: ', err2))
    } catch (err) {
      logger.error('Error while charging: ', err)
      api
        .modifyMessage({
          userId: 'me',
          id: detail.id,
          resource: {
            addLabelIds: [user.gmailCardDeclinedLabelId],
            removeLabelIds: [user.gmailPaidLabelId, user.gmailVerifiedLabelId]
          },
          auth: oauth2Client
        })
        .catch(err2 => logger.error('Error while changing label: ', err2))
    }
  } catch (error) {
    logger.error(error)
  }
}

async function checkSentEmails() {
  const dev = process.env.NODE_ENV !== 'production'
  const oauth2Client = api.getAuthClient()

  const userIds = (await Payment.find(
    { $or: [{ isCharged: false }, { isCardDeclined: false }] },
    'userId'
  )).map(p => p.userId)

  const filter = {
    _id: { $in: uniq(userIds) },
    isStripeConnected: true,
    stripeCustomer: { $exists: true },
    'stripeCustomer.livemode': !dev, // check only test users on dev
    gmailHistoryStartId: { $exists: true },
    gmailMainLabelId: { $exists: true },
    gmailVerifiedLabelId: { $exists: true },
    gmailCardDeclinedLabelId: { $exists: true },
    gmailPaidLabelId: { $exists: true }
  }

  const users = await User.find(
    filter,
    `googleId displayName email googleToken stripeCustomer price
     lastResponseTimes averageResponseTime
     gmailHistoryStartId gmailVerifiedLabelId gmailPaidLabelId gmailCardDeclinedLabelId`
  )

  logger.info('Mentor count who recieved email: %d', users.length)

  for (let i = 0; i < users.length; i += 1) {
    const user = users[i]
    let lastHistoryId
    let sentMessages

    oauth2Client.setCredentials(user.googleToken)

    try {
      // eslint-disable-next-line no-await-in-loop
      const sentEmails = await getSentEmails({ user, oauth2Client })

      lastHistoryId = sentEmails.lastHistoryId
      sentMessages = sentEmails.sentMessages
    } catch (error) {
      if (isAccessRevokedError(error)) {
        logger.error('Gmail API Error: %s, User: %s', error.message, user.email)
      } else {
        logger.error(error)
      }

      continue // eslint-disable-line no-continue
    }

    logger.info('%s(%s) message count %d', user.displayName, user.email, sentMessages.length)

    for (let j = 0; j < sentMessages.length; j += 1) {
      const message = sentMessages[j]

      // eslint-disable-next-line no-await-in-loop
      await checkEmailAndCharge({ message, user, oauth2Client })
    }

    if (lastHistoryId && !TEST_FROM_CLI) {
      // eslint-disable-next-line no-await-in-loop
      await User.updateOne({ _id: user.id }, { gmailHistoryStartId: lastHistoryId })
    }
  }
}

export default checkSentEmails

if (TEST_FROM_CLI) {
  // eslint-disable-next-line global-require
  require('dotenv').config()

  // eslint-disable-next-line global-require
  const mongoose = require('mongoose')
  mongoose.Promise = global.Promise
  mongoose.connect(process.env.MONGO_URL_TEST2, { useMongoClient: true })

  checkSentEmails().then(() => mongoose.disconnect())
}
