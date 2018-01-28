import express from 'express'
import session from 'express-session'
import mongoSessionStore from 'connect-mongo'
import bodyParser from 'body-parser'
import next from 'next'
import mongoose from 'mongoose'

import Rating from './models/Rating'
import Payment from './models/Payment'
import User from './models/User'
import setupAuth from './auth'
import { setup as setupStripe } from './stripe'
import setupSitemap from './sitemap'
import api from './api'
import publicApi from './public-api'

require('dotenv').config()

const dev = process.env.NODE_ENV !== 'production'

let MONGO_URL = dev ? process.env.MONGO_URL_TEST : process.env.MONGO_URL
MONGO_URL = process.env.USE_MONGO_TEST2 ? process.env.MONGO_URL_TEST2 : MONGO_URL

mongoose.Promise = global.Promise
mongoose.connect(MONGO_URL, { useMongoClient: true })

const port = process.env.PORT || 8080
const ROOT_URL = process.env.ROOT_URL || `http://localhost:${port}`

const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = express()

  server.use(bodyParser.json())
  server.use(bodyParser.urlencoded({ extended: true }))

  const MongoStore = mongoSessionStore(session)
  const sess = {
    name: 'findharbor.sid',
    secret: '":HD2w.)q*VqRT4/#NK2M/,E^B)}FED5fWU!dKe[wk',
    store: new MongoStore({
      mongooseConnection: mongoose.connection,
      ttl: 14 * 24 * 60 * 60 // save session 14 days
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true
    }
  }

  if (!dev) {
    server.set('trust proxy', 1) // trust first proxy
    sess.cookie.secure = true // serve secure cookies
  }

  server.use(session(sess))

  setupAuth({ server, ROOT_URL })
  setupStripe({ server })
  setupSitemap({ server })

  server.use('/api/v1', api)
  server.use('/public-api/v1', publicApi)

  server.get('/contact/:slug', (req, res) => {
    const queryParams = { slug: req.params.slug }
    app.render(req, res, '/contact', queryParams)
  })

  server.get('/checkout/:paymentId', (req, res) => {
    Payment.findById(req.params.paymentId, 'chargeFailedCount isCardDeclined userId amount')
      .then(payment => {
        if (!payment || !payment.isCardDeclined) {
          throw new Error('Not found')
        }

        User.findById(payment.userId, User.publicFields()).then(mentor =>
          app.render(req, res, '/checkout', { payment, mentor })
        )
      })
      .catch(error => {
        app.render(req, res, '/checkout', { error })
      })
  })

  server.get('/rate/yes/:id', (req, res) => {
    Rating.rate({ id: req.params.id, recommended: true })
      .then(({ mentorName }) => {
        app.render(req, res, '/rate', { mentorName })
      })
      .catch(error => {
        app.render(req, res, '/rate', { error })
      })
  })

  server.get('/rate/no/:id', (req, res) => {
    Rating.rate({ id: req.params.id, recommended: false })
      .then(({ mentorName }) => {
        app.render(req, res, '/rate', { mentorName })
      })
      .catch(error => {
        app.render(req, res, '/rate', { error })
      })
  })

  server.get('*', (req, res) => handle(req, res))

  server.listen(port, err => {
    if (err) throw err
    console.log(`> Ready on ${ROOT_URL}`) // eslint-disable-line no-console
  })
})
