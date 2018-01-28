import User from '../models/User'
import logger from '../log'

import * as api from './api'
import { isLabelExists, createLabel } from './createLabels'
import createFilter from './createFilter'
import { isAccessRevokedError } from './accessRevoked'

async function checkLabels(user) {
  const oauth2Client = api.getAuthClient()
  oauth2Client.setCredentials(user.googleToken)

  const labels = User.gmailLabels()

  for (let j = 0; j < labels.length; j += 1) {
    const l = labels[j]

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
      if (isAccessRevokedError(error)) {
        throw error
      } else {
        logger.error('Error while checking/creating labels', error)
      }

      break
    }
  }

  try {
    await createFilter(user.id)
    logger.info('checked filters')
  } catch (error) {
    if (isAccessRevokedError(error)) {
      throw error
    } else {
      logger.error('Error while checking/creating filters', error)
    }
  }
}

export default checkLabels
