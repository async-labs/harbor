import User from '../models/User'
import * as api from './api'
import { EMAIL_SUPPORT_FROM_ADDRESS } from '../constants'

async function migrateLabel() {
  const oauth2Client = api.getAuthClient()

  const users = await User.find({}, 'googleId displayName email googleToken gmailSettingsLabelId')

  for (let i = 0; i < users.length; i += 1) {
    const user = users[i]
    console.log(user.displayName, user.gmailSettingsLabelId)

    oauth2Client.setCredentials(user.googleToken)

    try {
      await api.updateLabel({
        userId: user.googleId,
        id: user.gmailSettingsLabelId,
        resource: { name: 'Harbor/Team Harbor' },
        auth: oauth2Client
      })
    } catch (err) {
      console.log(err)
    }
  }
}

async function migrateFilter() {
  const oauth2Client = api.getAuthClient()

  const users = await User.find(
    {},
    'googleId displayName email googleToken gmailSettingsLabelId gmailMainLabelId'
  )

  for (let i = 0; i < users.length; i += 1) {
    const user = users[i]
    console.log(user.displayName, user.gmailSettingsLabelId)

    oauth2Client.setCredentials(user.googleToken)

    let filters = []
    try {
      filters =
        (await api.getFilterList({
          userId: user.googleId,
          auth: oauth2Client
        })).filter || []
    } catch (err) {
      console.log(err)
    }

    for (let j = 0; j < filters.length; j += 1) {
      const filter = filters[j]
      const { criteria = {} } = filter

      if (
        criteria.from === EMAIL_SUPPORT_FROM_ADDRESS &&
        criteria.subject === 'Settings OR Welcome OR Update'
      ) {
        console.log(filter.id, 'deleting', criteria)
        await api.deleteFilter({
          id: filter.id,
          userId: user.googleId,
          auth: oauth2Client
        })
      }
    }

    if (user.gmailSettingsLabelId) {
      try {
        await api.createFilter({
          userId: user.googleId,
          resource: {
            action: {
              addLabelIds: [user.gmailSettingsLabelId]
            },
            criteria: {
              from: EMAIL_SUPPORT_FROM_ADDRESS
            }
          },
          auth: oauth2Client
        })
      } catch (error) {
        console.log(error.message)
      }
    }

    if (user.gmailMainLabelId) {
      try {
        await api.createFilter({
          userId: user.googleId,
          resource: {
            action: {
              addLabelIds: [user.gmailMainLabelId]
            },
            criteria: {
              from: EMAIL_SUPPORT_FROM_ADDRESS
            }
          },
          auth: oauth2Client
        })
      } catch (error) {
        console.log(error.message)
      }
    }
  }
}

function init() {
  // eslint-disable-next-line global-require
  require('dotenv').config()

  // eslint-disable-next-line global-require
  const mongoose = require('mongoose')
  mongoose.Promise = global.Promise
  // mongoose.connect(process.env.MONGO_URL_TEST2, { useMongoClient: true })
  // mongoose.connect(process.env.MONGO_URL_TEST, { useMongoClient: true })
  // mongoose.connect(process.env.MONGO_URL, { useMongoClient: true })

  // migrateLabel().then(() => mongoose.disconnect()).catch(err => {
  //   console.log(err)
  //   mongoose.disconnect()
  // })

  // migrateFilter().then(() => mongoose.disconnect()).catch(err => {
  //   console.log(err)
  //   mongoose.disconnect()
  // })
}

init()
