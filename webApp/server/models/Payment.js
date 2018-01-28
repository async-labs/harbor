import mongoose, { Schema } from 'mongoose'
import moment from 'moment'
import addrs from 'email-addresses'

import Rating from './Rating'
import BlackList from './BlackList'
import User from './User'
import { EMAIL_QUESTION_FROM_ADDRESS, EMAIL_SUPPORT_FROM_ADDRESS } from '../constants'
import { sendEmail } from '../aws'
import { chargeFailedToCustomer } from '../emailTemplates'
import { createCustomer, charge as stripeCharge } from '../stripe'
import logger from '../log'
import * as gmailApi from '../gmail/api'

const validateEmail = email => !!addrs(email)

const schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  createdAt: {
    type: Date,
    required: true
  },
  repliedAt: {
    type: Date
  },
  isRatingEmailSent: {
    type: Boolean,
    default: false,
    required: true
  },

  amount: {
    type: Number,
    required: true
  },
  chargedAt: {
    type: Date
  },
  isCharged: {
    type: Boolean,
    default: false,
    required: true
  },
  chargeFailedAt: {
    type: Date
  },
  chargeFailedCount: {
    type: Number,
    default: 0,
    required: true
  },
  isCardDeclined: {
    type: Boolean,
    default: false,
    required: true
  },

  stripeCustomer: {
    card: {
      brand: String,
      exp_month: Number,
      exp_year: Number,
      id: String,
      last4: String
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: [validateEmail, 'Please fill a valid email address']
    },
    id: {
      type: String,
      required: true
    },
    livemode: {
      type: Boolean,
      required: true
    }
  },
  stripeCharge: {
    id: String,
    amount: Number,
    created: Number,
    livemode: Boolean,
    paid: Boolean,
    application_fee: String,
    status: String
  },
  email: {
    subject: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    isSent: {
      type: Boolean,
      default: false,
      required: true
    },
    gmailId: String,
    messageId: String // 'Message-ID' from Amazon SES
  }
})

class PaymentClass {
  static async getMonthlyIncomeReport({ userId }) {
    const user = await User.findById(userId, 'id createdAt')
    const incomeList = {}

    if (!user) {
      return Promise.reject(new Error('User not found'))
    }

    const userRegisteredMonth = moment(user.createdAt).format('YYYYMM')
    const month = moment()

    while (month.format('YYYYMM') !== userRegisteredMonth) {
      incomeList[month.format('MMMM, YYYY')] = 0
      month.subtract(1, 'months')
    }

    incomeList[moment(user.createdAt).format('MMMM, YYYY')] = 0

    const payments = await this.find(
      { userId, isCharged: true, stripeCharge: { $exists: true } },
      'stripeCharge chargedAt createdAt'
    )

    payments.forEach(payment => {
      const m = moment(payment.chargedAt || payment.createdAt).format('MMMM, YYYY')

      incomeList[m] = payment.stripeCharge.amount * 0.9 + (incomeList[m] || 0)
    })

    return Object.keys(incomeList).map(k => ({ month: k, income: incomeList[k] / 100 }))
  }

  static async createNewPayment({ userId, stripeToken, email }) {
    const user = await User.findById(userId, 'id email displayName price')
    if (!user) {
      return Promise.reject(new Error('User not found'))
    }

    const blackList = await BlackList.findOne({
      email: stripeToken.email
    })
    if (blackList) {
      return Promise.reject(
        new Error(
          `You (${stripeToken.email}) can't request advice on Harbor due to unpaid email advice.
          <a style="color: white; font-weight: 600" href="/checkout/${blackList.notPaidPaymentId}" target="_blank" rel="noopener noreferrer">Click here to pay</a>`
        )
      )
    }

    const createdAt = new Date()

    const customer = await createCustomer({ token: stripeToken.id, email: stripeToken.email })
    customer.card = stripeToken.card
    const payment = await this.create({
      userId,
      createdAt,
      stripeCustomer: customer,
      email,
      amount: user.price
    })

    sendEmail({
      from: `Harbor <${EMAIL_QUESTION_FROM_ADDRESS}>`,
      to: [user.email],
      cc: [stripeToken.email],
      subject: email.subject,
      body: `${email.message.replace(/\n/g, '<br>')}<p></p>
        Note to ${user.displayName} (${user.email}):
        <li>You'll be paid for replying <b>to this email</b>.</li>
        <li>If you're not able to reply to this email, the sender won't be charged.</li>
        <li>After receiving your reply, the sender's card will be automatically charged
        and the sender will be asked to rate your reply.</li>`,
      replyTo: [stripeToken.email]
    })
      .then(info => {
        logger.info('Email sent', info)

        this.updateOne(
          { _id: payment.id },
          { $set: { 'email.isSent': true, 'email.messageId': info.MessageId } }
        ).exec()
      })
      .catch(err => {
        logger.error('Email sending error:', err)
      })

    return payment
  }

  async charge({ user }) {
    try {
      const chargeObj = await stripeCharge({
        customerId: this.stripeCustomer.id,
        account: user.stripeCustomer.stripe_user_id,
        mentorName: user.displayName,
        mentorEmail: user.email,
        customerEmail: this.stripeCustomer.email,
        amount: this.amount * 100
      })

      await this.update({
        $set: {
          isCharged: true,
          isCardDeclined: false,
          chargedAt: new Date(),
          stripeCharge: chargeObj
        },
        $unset: {
          chargeFailedAt: 1
        }
      })

      Rating.createNewRating({ payment: this })
        .then(() => {
          logger.info('rating email sent')
          this.update({ $set: { isRatingEmailSent: true } }).exec()
        })
        .catch(err => {
          logger.error('Error while creating rating: ', err)
        })

      return chargeObj
    } catch (error) {
      await this.update({
        $set: { isCardDeclined: true, chargeFailedAt: new Date() },
        $inc: { chargeFailedCount: 1 }
      })

      const emailToCustomer = await chargeFailedToCustomer({
        customerEmail: this.stripeCustomer.email,
        mentorName: user.displayName,
        paymentId: this.id
      })

      await BlackList.findOneAndUpdate(
        { email: this.stripeCustomer.email },
        { email: this.stripeCustomer.email, notPaidPaymentId: this.id },
        { upsert: true }
      )

      sendEmail({
        from: `Harbor <${EMAIL_SUPPORT_FROM_ADDRESS}>`,
        to: [this.stripeCustomer.email],
        cc: [user.email],
        subject: emailToCustomer.subject,
        body: emailToCustomer.message
      }).catch(err => {
        logger.error('Email sending error:', err)
      })

      throw error
    }
  }

  async chargeDebt({ stripeToken }) {
    try {
      const user = await User.findById(
        this.userId,
        `displayName email stripeCustomer googleToken googleId
         gmailPaidLabelId gmailCardDeclinedLabelId gmailVerifiedLabelId`
      )
      const customer = await createCustomer({ token: stripeToken.id, email: stripeToken.email })

      const chargeObj = await stripeCharge({
        customerId: customer.id,
        account: user.stripeCustomer.stripe_user_id,
        mentorName: user.displayName,
        mentorEmail: user.email,
        customerEmail: stripeToken.email,
        amount: this.amount * 100
      })

      await this.update({
        $set: {
          isCharged: true,
          isCardDeclined: false,
          chargedAt: new Date(),
          stripeCharge: chargeObj
        },
        $unset: {
          chargeFailedAt: 1
        }
      })

      this.stripeCustomer = customer
      Rating.createNewRating({ payment: this })
        .then(() => {
          logger.info('rating email sent')
          this.update({ $set: { isRatingEmailSent: true } }).exec()
        })
        .catch(err => {
          logger.error('Error while creating rating: ', err)
        })

      await BlackList.remove({ email: stripeToken.email })

      const oauth2Client = gmailApi.getAuthClient()
      oauth2Client.setCredentials(user.googleToken)

      gmailApi
        .modifyMessage({
          userId: user.googleId,
          id: this.email.gmailId,
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

      return chargeObj
    } catch (error) {
      logger.error('Error while charging debt', error)
      throw error
    }
  }
}

schema.loadClass(PaymentClass)

const Payment = mongoose.model('Payment', schema)

export default Payment
