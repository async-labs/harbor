import User from '../models/User'

import * as api from './api'
import logger from '../log'

export default async function setHistoryStartId(userId) {
  const oauth2Client = api.getAuthClient()
  const user = await User.findById(userId, 'googleId googleToken gmailHistoryStartId')

  if (user.gmailHistoryStartId) {
    return
  }

  oauth2Client.setCredentials(user.googleToken)

  try {
    const list = await api.messagesList({
      userId: user.googleId,
      maxResults: 1,
      auth: oauth2Client
    })

    if (list && list.messages && list.messages[0]) {
      const lastMessage = await api.getMessage({
        userId: user.googleId,
        id: list.messages[0].id,
        auth: oauth2Client
      })

      if (lastMessage && lastMessage.historyId) {
        User.updateOne({ _id: userId }, { gmailHistoryStartId: lastMessage.historyId }).exec()
      }
    }
  } catch (error) {
    logger.error(error)
  }
}
