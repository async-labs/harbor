import express from 'express'

import Payment from './models/Payment'
import User from './models/User'
import logger from './log'

const router = express.Router()

router.get('/get-mentor-detail/:slug', (req, res) => {
  User.findOne({ slug: req.params.slug }, User.publicFields())
    .then(user => {
      if (!user) {
        return Promise.reject(new Error('Mentor not found'))
      }

      return res.json(user.toObject())
    })
    .catch(err => res.json({ error: err.message || err.toString() }))
})

router.post('/create-payment', (req, res) => {
  const { stripeToken, mentorId, email } = req.body

  if (!stripeToken || !mentorId || !email) {
    res.json({ error: 'Invalid data' })
    return
  }

  Payment.createNewPayment({ userId: mentorId, stripeToken, email })
    .then(() => {
      res.json({ saved: true })
    })
    .catch(err => {
      logger.error(err)
      res.json({ error: err.message || err.toString() })
    })
})

router.post('/pay-payment/:paymentId', (req, res) => {
  const { stripeToken } = req.body

  if (!stripeToken) {
    res.json({ error: 'Invalid data' })
    return
  }

  Payment.findById(req.params.paymentId, 'amount userId email')
    .then(payment => {
      if (!payment) {
        throw new Error('Not found')
      }

      return payment.chargeDebt({ stripeToken })
    })
    .then(() => {
      res.json({ charged: true })
    })
    .catch(err => {
      logger.error(err)
      res.json({ error: err.message || err.toString() })
    })
})

export default router
