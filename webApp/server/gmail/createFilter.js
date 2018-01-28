import User from '../models/User'
import logger from '../log'
import { EMAIL_QUESTION_FROM_ADDRESS, EMAIL_SUPPORT_FROM_ADDRESS } from '../constants'

import * as api from './api'

export default async function createFilter(userId) {
  const user = await User.findById(
    userId,
    `googleId googleToken gmailVerifiedLabelId
     gmailMainLabelId gmailSettingsLabelId gmailCardDeclinedLabelId`
  )

  const oauth2Client = api.getAuthClient()

  oauth2Client.setCredentials(user.googleToken)

  if (user.gmailVerifiedLabelId) {
    try {
      await api.createFilter({
        appUserId: userId,
        userId: user.googleId,
        resource: {
          action: {
            addLabelIds: [user.gmailVerifiedLabelId]
          },
          criteria: {
            from: EMAIL_QUESTION_FROM_ADDRESS
          }
        },
        auth: oauth2Client
      })
    } catch (error) {
      if (error.message !== 'Filter already exists') {
        logger.error(error)
        throw error
      }
    }
  }

  if (user.gmailCardDeclinedLabelId) {
    try {
      await api.createFilter({
        appUserId: userId,
        userId: user.googleId,
        resource: {
          action: {
            addLabelIds: [user.gmailCardDeclinedLabelId]
          },
          criteria: {
            from: EMAIL_SUPPORT_FROM_ADDRESS,
            subject: 'Card declined'
          }
        },
        auth: oauth2Client
      })
    } catch (error) {
      if (error.message !== 'Filter already exists') {
        logger.error(error)
        throw error
      }
    }
  }

  if (user.gmailMainLabelId) {
    try {
      await api.createFilter({
        appUserId: userId,
        userId: user.googleId,
        resource: {
          action: {
            addLabelIds: [user.gmailMainLabelId]
          },
          criteria: {
            from: EMAIL_QUESTION_FROM_ADDRESS
          }
        },
        auth: oauth2Client
      })
    } catch (error) {
      if (error.message !== 'Filter already exists') {
        logger.error(error)
        throw error
      }
    }

    try {
      await api.createFilter({
        appUserId: userId,
        userId: user.googleId,
        resource: {
          action: {
            addLabelIds: [user.gmailMainLabelId]
          },
          criteria: {
            from: EMAIL_SUPPORT_FROM_ADDRESS,
            subject: 'Card declined'
          }
        },
        auth: oauth2Client
      })
    } catch (error) {
      if (error.message !== 'Filter already exists') {
        logger.error(error)
        throw error
      }
    }

    try {
      await api.createFilter({
        appUserId: userId,
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
      if (error.message !== 'Filter already exists') {
        logger.error(error)
        throw error
      }
    }
  }

  if (user.gmailSettingsLabelId) {
    try {
      await api.createFilter({
        appUserId: userId,
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
      if (error.message !== 'Filter already exists') {
        logger.error(error)
        throw error
      }
    }
  }
}
