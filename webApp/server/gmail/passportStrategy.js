import util from 'util'
import passport from 'passport-strategy'
import google from 'googleapis'

function Strategy({ clientID, clientSecret, callbackURL }, verify) {
  if (!verify) {
    throw new TypeError('Strategy requires a verify callback')
  }

  if (!clientID) {
    throw new TypeError('Strategy requires a clientID option')
  }

  if (!clientSecret) {
    throw new TypeError('Strategy requires a clientSecret option')
  }

  if (!callbackURL) {
    throw new TypeError('Strategy requires a callbackURL option')
  }

  passport.Strategy.call(this)
  this.name = 'google-oauth2'
  this.verify = verify

  const OAuth2 = google.auth.OAuth2
  this.oauth2Client = new OAuth2(clientID, clientSecret, callbackURL)
}

// Inherit from `passport.Strategy`.
util.inherits(Strategy, passport.Strategy)

Strategy.prototype.authenticate = function authenticate(req, options) {
  if (req.query && req.query.error) {
    if (req.query.error === 'access_denied') {
      this.fail({ message: req.query.error_description })
      return
    }

    this.error(new Error(req.query.error_description, req.query.error, req.query.error_uri))
    return
  }

  if (req.query && req.query.code) {
    this.oauth2Client.getToken(req.query.code, (err, token) => {
      if (err) {
        this.error(err)
        return
      }

      this.oauth2Client.setCredentials(token)
      this.loadUserProfile((err2, profile) => {
        if (err2) {
          this.error(err2)
          return
        }

        const verified = (err3, user, info) => {
          if (err3) {
            this.error(err3)
            return
          }

          if (!user) {
            this.fail(info)
            return
          }

          this.success(user, info || {})
        }

        this.verify(token, profile, verified)
      })
    })
  } else {
    const authUrl = this.oauth2Client.generateAuthUrl(
      Object.assign(
        {},
        {
          access_type: 'offline'
        },
        options
      )
    )
    this.redirect(authUrl)
  }
}

Strategy.prototype.loadUserProfile = function loadUserProfile(done) {
  const plus = google.plus('v1')

  plus.people.get(
    {
      userId: 'me',
      auth: this.oauth2Client
    },
    (err, resp) => {
      if (err) {
        done(err)
        return
      }

      const profile = resp
      profile.provider = 'google'

      done(null, profile)
    }
  )
}

module.exports = Strategy
