import mongoose, { Schema } from 'mongoose'

import { EMAIL_SUPPORT_FROM_ADDRESS } from '../constants'
import User from '../models/User'
import { sendEmail } from '../aws'
import { toMentorGoogleAccessRevoked } from '../emailTemplates'
import logger from '../log'

const Session = mongoose.model('Session', new Schema(), 'sessions')

// when user's google access revoked, we will sent email to user about it
// and log out from all sessions
export default async function accessRevoked(userId) {
  if (!userId) {
    return null
  }

  const user = await User.findById(userId, 'email displayName')
  if (!user) {
    return null
  }

  const emailTemplate = await toMentorGoogleAccessRevoked({ mentorName: user.displayName })

  sendEmail({
    from: `Harbor <${EMAIL_SUPPORT_FROM_ADDRESS}>`,
    to: [user.email],
    cc: [EMAIL_SUPPORT_FROM_ADDRESS],
    subject: emailTemplate.subject,
    body: emailTemplate.message
  })
    .then(info => {
      logger.info('Email about "access revoked" sent', info)
    })
    .catch(err => {
      logger.error('Email sending error:', err)
    })

  const filter = { session: { $regex: `.*"passport":{.*"user":"${userId}".*` } }

  return Session.remove(filter)
}

export function isAccessRevokedError(err) {
  return err.message === 'Invalid Credentials' || err.message === 'invalid_request'
}
