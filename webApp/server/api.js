import express from 'express'

import User from './models/User'
import Payment from './models/Payment'
import logger from './log'
import { isAccessRevokedError } from './gmail/accessRevoked'
import checkLabelsAndFilters from './gmail/checkLabelsAndFilters'

const router = express.Router()

router.use((req, res, next) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized access' })
    return
  }

  next()
})

router.post('/change-price', (req, res) => {
  User.updateOne({ _id: req.user.id }, { price: req.body.price }, { runValidators: true })
    .then(raw => res.json(raw))
    .catch(err => res.json({ error: err.message || err.toString() }))
})

router.post('/change-status', (req, res) => {
  User.updateOne(
    { _id: req.user.id },
    { isMentorPagePublic: req.body.isMentorPagePublic },
    { runValidators: true }
  )
    .then(raw => res.json(raw))
    .catch(err => res.json({ error: err.message || err.toString() }))
})

router.post('/change-description', (req, res) => {
  User.updateOne({ _id: req.user.id }, { description: req.body.description })
    .then(raw => res.json(raw))
    .catch(err => res.json({ error: err.message || err.toString() }))
})

router.get('/get-income-report', (req, res) => {
  Payment.getMonthlyIncomeReport({ userId: req.user.id })
    .then(incomeList => res.json({ incomeList }))
    .catch(err => res.json({ error: err.message || err.toString() }))
})

router.get('/get-mentor-list', (req, res) => {
  if (!req.user.isAdmin) {
    res.status(401).json({ error: 'Unauthorized access' })
    return
  }

  User.getMentorList()
    .then(mentors => res.json(mentors))
    .catch(err => res.json({ error: err.message || err.toString() }))
})

router.get('/update-profile', (req, res) => {
  User.findById(req.user.id, 'googleToken googleId email')
    .then(user => user.updateProfileFromGoogle())
    .then(result => res.json(result))
    .catch(err => {
      const json = { error: err.message || err.toString() }
      if (isAccessRevokedError(err)) {
        json.isGoogleAccessRevokedError = true
      }

      res.json(json)
    })
})

router.get('/check-labels-and-filters', (req, res) => {
  const labelFields = User.gmailLabels().map(l => l.fieldName)

  User.findById(req.user.id, `googleToken googleId ${labelFields.join(' ')}`)
    .then(user => checkLabelsAndFilters(user))
    .then(() => res.json({ checked: true }))
    .catch(err => {
      logger.error(err)
      const json = { error: err.message || err.toString() }
      if (isAccessRevokedError(err)) {
        json.isGoogleAccessRevokedError = true
      }

      res.json(json)
    })
})

export default router
