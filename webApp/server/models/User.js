import isEmpty from 'lodash/isEmpty'
import mean from 'lodash/mean'
import pick from 'lodash/pick'

import mongoose, { Schema } from 'mongoose'

// import Invitation from './Invitation'
import { EMAIL_SUPPORT_FROM_ADDRESS } from '../constants'
import generateSlug from '../utils/slugify'
import { setup } from '../gmail'
import { sendEmail } from '../aws'
import {
  welcome as getWelcomeEmail,
  settings as getSettingsEmail,
  tips as getTipsEmail
} from '../emailTemplates'
import logger from '../log'
import * as gmailApi from '../gmail/api'

const schema = new Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  googleToken: {
    access_token: String,
    refresh_token: String,
    token_type: String,
    expiry_date: Number
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  displayName: String,
  description: {
    type: String,
    default: ''
  },
  avatarUrl: String,

  lastResponseTimes: [Number], // last 10 response times in minutes
  averageResponseTime: {
    default: 1,
    required: true,
    type: Number // in hours
  },

  repliedCount: {
    type: Number,
    default: 0
  },
  rating: {
    totalCount: {
      type: Number,
      default: 0
    },
    recommendCount: {
      type: Number,
      default: 0
    },
    notRecommendCount: {
      type: Number,
      default: 0
    }
  },
  links: [
    {
      url: {
        type: String,
        required: true
      },
      title: {
        type: String,
        required: true
      }
    }
  ],

  price: {
    type: Number,
    required: true,
    default: 50,
    validate: {
      validator(v) {
        return [25, 50, 100].includes(v)
      },
      message: '{VALUE} is not a valid price!'
    }
  },

  isMentorPagePublic: {
    type: Boolean,
    required: true,
    default: true
  },

  isStripeConnected: Boolean,
  stripeCustomer: {
    token_type: String,
    stripe_publishable_key: String,
    scope: String,
    livemode: Boolean,
    stripe_user_id: String,
    refresh_token: String,
    access_token: String
  },

  gmailHistoryStartId: String,
  gmailMainLabelId: String,
  gmailVerifiedLabelId: String,
  gmailPaidLabelId: String,
  gmailSettingsLabelId: String,
  gmailCardDeclinedLabelId: String,

  isAdmin: {
    type: Boolean,
    default: false
  }
})

class UserClass {
  static publicFields() {
    return [
      'id',
      'displayName',
      'email',
      'avatarUrl',
      'slug',
      'description',
      'links',
      'price',
      'isStripeConnected',
      'isMentorPagePublic',
      'averageResponseTime',
      'repliedCount',
      'rating',
      'isAdmin'
    ]
  }

  static gmailLabels() {
    return [
      { fieldName: 'gmailMainLabelId', labelName: 'Harbor' },
      { fieldName: 'gmailVerifiedLabelId', labelName: 'Harbor/Card verified' },
      { fieldName: 'gmailPaidLabelId', labelName: 'Harbor/Payment successful' },
      { fieldName: 'gmailCardDeclinedLabelId', labelName: 'Harbor/Payment pending' },
      { fieldName: 'gmailSettingsLabelId', labelName: 'Harbor/Team Harbor' }
    ]
  }

  static signInOrSignUp({ googleId, email, googleToken, displayName, avatarUrl }) {
    return this.findOne({ googleId }, UserClass.publicFields().join(' ')).then(user => {
      if (user) {
        const modifier = {}
        Object.keys(googleToken || {}).forEach(k => {
          if (googleToken[k]) {
            modifier[`googleToken.${k}`] = googleToken[k]
          }
        })

        if (isEmpty(modifier)) {
          setup(user.id)
          return Promise.resolve(user)
        }

        return this.updateOne({ googleId }, { $set: modifier }).then(() => {
          setup(user.id)
          return Promise.resolve(user)
        })
      }

      return generateSlug(this, displayName).then(slug =>
        this.create({
          createdAt: new Date(),
          googleId,
          email,
          googleToken,
          displayName,
          avatarUrl,
          slug
        }).then(newUser => {
          setup(newUser.id).then(() => {
            getWelcomeEmail({
              mentorName: displayName,
              mentorSlug: slug
            })
              .then(template =>
                sendEmail({
                  from: `Harbor <${EMAIL_SUPPORT_FROM_ADDRESS}>`,
                  to: [email],
                  subject: template.subject,
                  body: template.message
                })
              )
              .catch(error => {
                logger.error('Email sending error:', error)
              })

            getTipsEmail({
              mentorName: displayName,
              mentorSlug: slug
            })
              .then(template =>
                sendEmail({
                  from: `Harbor <${EMAIL_SUPPORT_FROM_ADDRESS}>`,
                  to: [email],
                  subject: template.subject,
                  body: template.message
                })
              )
              .catch(error => {
                logger.error('Email sending error:', error)
              })

            getSettingsEmail({
              mentorName: displayName,
              mentorSlug: slug
            })
              .then(template =>
                sendEmail({
                  from: `Harbor <${EMAIL_SUPPORT_FROM_ADDRESS}>`,
                  to: [email],
                  subject: template.subject,
                  body: template.message
                })
              )
              .catch(error => {
                logger.error('Email sending error:', error)
              })
          })

          return Promise.resolve(pick(newUser, UserClass.publicFields()))
        })
      )

      // return Invitation.findOne({ email }).then(invitation => {
      //   if (!invitation) {
      //     return Promise.resolve(false)
      //   }

      //   return generateSlug(this, displayName).then(slug =>
      //     this.create({
      //       googleId,
      //       email,
      //       googleToken,
      //       displayName,
      //       avatarUrl,
      //       slug
      //     }).then(newUser => {
      //       setup(newUser.id)
      //       return Promise.resolve(pick(newUser, UserClass.publicFields()))
      //     })
      //   )
      // })
    })
  }

  static getMentorList() {
    return this.find({}, UserClass.publicFields().join(' ')).sort({ createdAt: -1 })
  }

  async updateProfileFromGoogle() {
    const oauth2Client = gmailApi.getAuthClient()
    oauth2Client.setCredentials(this.googleToken)

    let profile
    try {
      profile = await gmailApi.getProfile({
        userId: 'me',
        auth: oauth2Client,
        appUserId: this.id
      })
    } catch (err) {
      logger.error('Error while getting profile: ', err)
      throw err
    }

    const modifier = { displayName: profile.displayName }

    if (profile.image && profile.image.url) {
      modifier.avatarUrl = profile.image.url.replace('sz=50', 'sz=128')
    }

    await this.update({ $set: modifier })

    return modifier
  }

  calculateAverageResponseTime({ askedAt, repliedAt }) {
    const responseTimeInMinutes = Math.round(
      (repliedAt.getTime() - askedAt.getTime()) / (60 * 1000)
    )

    const { lastResponseTimes = [] } = this
    lastResponseTimes.push(responseTimeInMinutes)

    if (lastResponseTimes.length > 10) {
      lastResponseTimes.shift()
    }

    this.update({
      $inc: {
        repliedCount: 1
      },
      $set: {
        lastResponseTimes,
        averageResponseTime: Math.round(mean(lastResponseTimes) / 60) || 1
      }
    }).exec()
  }
}

schema.loadClass(UserClass)

const User = mongoose.model('User', schema)

export default User
