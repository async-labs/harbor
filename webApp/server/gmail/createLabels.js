import User from '../models/User'
import logger from '../log'

import * as api from './api'
import { isAccessRevokedError } from './accessRevoked'

export async function isLabelExists({ user, oauth2Client, labelId }) {
  try {
    const label = await api.getLabel({
      appUserId: user.id,
      userId: user.googleId,
      id: labelId,
      auth: oauth2Client
    })

    return !!label && !label.error
  } catch (error) {
    if (error.message === 'Not Found') {
      return false
    }

    throw error
  }
}

export async function createLabel({ user, oauth2Client, labelName, fieldName }) {
  const modifier = {}
  try {
    const label = await api.createLabel({
      appUserId: user.id,
      userId: user.googleId,
      resource: { name: labelName },
      auth: oauth2Client
    })

    modifier[`${fieldName}`] = label.id
  } catch (error) {
    try {
      const response = await api.getLabelList({
        appUserId: user.id,
        userId: user.googleId,
        auth: oauth2Client
      })

      if (response && response.labels) {
        response.labels.forEach(l => {
          if (l.name === labelName) {
            modifier[`${fieldName}`] = l.id
          }
        })
      }
    } catch (error2) {
      logger.error(error.message)
      logger.error(error2.message)

      throw error2
    }
  }

  await User.updateOne({ _id: user.id }, modifier)
}

export default async function createLabels(userId) {
  const labels = User.gmailLabels()
  const labelFields = labels.map(l => l.fieldName)

  const user = await User.findById(userId, `googleId googleToken ${labelFields.join(' ')}`)

  const oauth2Client = api.getAuthClient()

  oauth2Client.setCredentials(user.googleToken)

  for (let i = 0; i < labels.length; i += 1) {
    const l = labels[i]

    const labelId = user[l.fieldName]

    try {
      // eslint-disable-next-line no-await-in-loop
      if (!labelId || !await isLabelExists({ labelId, user, oauth2Client })) {
        // eslint-disable-next-line no-await-in-loop
        await createLabel({
          user,
          oauth2Client,
          labelName: l.labelName,
          fieldName: l.fieldName
        })
      }
    } catch (error) {
      logger.error('Error while checking/creating label', l, error)
      if (isAccessRevokedError(error)) {
        throw error
      }
    }
  }
}
