import qs from 'qs'
import request from 'request'
import stripe from 'stripe'

import User from './models/User'

const TOKEN_URI = 'https://connect.stripe.com/oauth/token'
const AUTHORIZE_URI = 'https://connect.stripe.com/oauth/authorize'

const SIMULATE_CHARGE_FAILED = !!process.env.SIMULATE_CHARGE_FAILED

export function setup({ server }) {
  const dev = process.env.NODE_ENV !== 'production'

  const CLIENT_ID = dev ? process.env.Stripe_Test_ClientID : process.env.Stripe_Live_ClientID
  const API_KEY = dev ? process.env.Stripe_Test_SecretKey : process.env.Stripe_Live_SecretKey

  server.get('/auth/stripe', (req, res) => {
    if (!req.user) {
      res.redirect('/login')
      return
    }

    // Generate a random string as state to protect from CSRF and place it in the session.
    req.session.state = Math.random().toString(36).slice(2)

    // Redirect to Stripe /oauth/authorize endpoint
    res.redirect(
      `${AUTHORIZE_URI}?${qs.stringify({
        response_type: 'code',
        scope: 'read_write',
        state: req.session.state,
        client_id: CLIENT_ID
      })}`
    )
  })

  server.get('/auth/stripe/callback', (req, res) => {
    if (!req.user) {
      res.redirect('/login')
      return
    }

    // Check the state we got back equals the one we generated before proceeding.
    if (req.session.state !== req.query.state) {
      res.redirect('/?error=Invalid request')
      return
    }

    if (req.query.error) {
      res.redirect(`/?error=${req.query.error_description}`)
      return
    }

    const code = req.query.code

    request.post(
      {
        url: TOKEN_URI,
        form: {
          grant_type: 'authorization_code',
          client_id: CLIENT_ID,
          code,
          client_secret: API_KEY
        }
      },
      (err, r, body) => {
        if (err) {
          res.redirect(`/?error=${err.message || err.toString()}`)
          return
        }

        const result = JSON.parse(body)

        if (result.error) {
          res.redirect(`/?error=${result.error_description}`)
          return
        }

        User.updateOne(
          { _id: req.user.id },
          { $set: { isStripeConnected: true, stripeCustomer: result } }
        )
          .then(() => res.redirect('/'))
          .catch(err2 => res.redirect(`/?error=${err2.message || err2.toString()}`))
      }
    )
  })
}

export function createCustomer({ token, email }) {
  const dev = process.env.NODE_ENV !== 'production'

  const API_KEY = dev ? process.env.Stripe_Test_SecretKey : process.env.Stripe_Live_SecretKey
  const client = stripe(API_KEY)

  return client.customers.create({
    email,
    source: token
  })
}

export function charge({ customerId, amount, account, mentorName, mentorEmail, customerEmail }) {
  const dev = process.env.NODE_ENV !== 'production'

  const API_KEY = dev ? process.env.Stripe_Test_SecretKey : process.env.Stripe_Live_SecretKey
  const client = stripe(API_KEY)

  // charge exactly 10% including Stripe fee
  const fee = amount * 0.1 - Math.round(amount * 0.029) - 30

  return client.tokens
    .create(
    {
      customer: customerId
    },
    {
      stripe_account: account
    }
    )
    .then(token =>
      client.charges.create(
        {
          amount,
          application_fee: fee,
          currency: 'usd',
          source: SIMULATE_CHARGE_FAILED ? 'tok_chargeDeclined' : token.id,
          receipt_email: customerEmail,
          description: `Payment from ${customerEmail} to ${mentorEmail} (${mentorName}) for advice via email`
        },
        {
          stripe_account: account
        }
      )
    )
}
