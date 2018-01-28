import mongoose, { Schema } from 'mongoose'

import { EMAIL_SUPPORT_FROM_ADDRESS } from '../constants'
import { sendEmail } from '../aws'
import { rating as getRatingEmail } from '../emailTemplates'
import logger from '../log'
import getRootURL from '../../lib/getRootURL'

import User from './User'

const schema = new Schema({
  mentorId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  paymentId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  createdAt: {
    type: Date,
    required: true
  },
  clicked: {
    type: Boolean,
    default: false,
    required: true
  },
  recommended: {
    type: Boolean
  }
})

class RatingClass {
  static async rate({ id, recommended }) {
    const rate = await this.findById(id, 'id mentorId clicked')
    if (!rate) {
      return Promise.reject(new Error('Not found'))
    }

    const mentor = await User.findById(rate.mentorId, 'id displayName')
    if (!mentor) {
      return Promise.reject(new Error('Not found'))
    }

    if (rate.clicked) {
      return Promise.reject(new Error('You already rated this advice.'))
    }

    await rate.update({ clicked: true, recommended })
    await mentor.update({
      $inc: {
        'rating.totalCount': 1,
        'rating.recommendCount': recommended ? 1 : 0,
        'rating.notRecommendCount': recommended ? 0 : 1
      }
    })

    return { mentorName: mentor.displayName }
  }

  static async createNewRating({ payment }) {
    if (!payment) {
      return Promise.reject(new Error('Payment is required'))
    }

    const user = await User.findById(payment.userId, 'id displayName')
    if (!user) {
      return Promise.reject(new Error('User not found'))
    }

    const createdAt = new Date()
    const rating = await this.create({
      mentorId: payment.userId,
      paymentId: payment.id,
      createdAt
    })

    const urls = rating.getRatingURLs()
    const email = await getRatingEmail({
      mentorName: user.displayName,
      yesLink: urls.yes,
      noLink: urls.no,
      mentorSlug: user.slug
    })

    try {
      const info = await sendEmail({
        from: `Harbor <${EMAIL_SUPPORT_FROM_ADDRESS}>`,
        to: [payment.stripeCustomer.email],
        subject: email.subject,
        body: email.message
      })
      logger.info('Rating email sent', info)
    } catch (error) {
      logger.error('Email sending error:', error)

      await this.remove({ _id: rating.id })
      throw error
    }

    return rating
  }

  getRatingURLs() {
    const rootURL = getRootURL()

    return {
      yes: `${rootURL}/rate/yes/${this.id}`,
      no: `${rootURL}/rate/no/${this.id}`
    }
  }
}

schema.loadClass(RatingClass)

const Rating = mongoose.model('Rating', schema)

export default Rating
