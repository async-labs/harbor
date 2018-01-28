import passport from 'passport'
import GoogleStrategy from './gmail/passportStrategy'

import User from './models/User'

export default function setup({ ROOT_URL, server }) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.Google_clientID,
        clientSecret: process.env.Google_clientSecret,
        callbackURL: `${ROOT_URL}/auth/google/callback`
      },
      (googleToken, profile, cb) => {
        let email
        let avatarUrl

        if (profile.emails) {
          email = profile.emails[0].value
        }

        if (profile.image && profile.image.url) {
          avatarUrl = profile.image.url.replace('sz=50', 'sz=128')
        }

        User.signInOrSignUp({
          googleId: profile.id,
          email,
          googleToken,
          displayName: profile.displayName,
          avatarUrl
        })
          .then(user => cb(null, user))
          .catch(err => cb(err))
      }
    )
  )

  passport.serializeUser((user, done) => {
    done(null, user.id)
  })

  passport.deserializeUser((id, done) => {
    User.findById(id, User.publicFields(), (err, user) => {
      done(err, user)
    })
  })

  server.use(passport.initialize())
  server.use(passport.session())

  server.get('/auth/google', (req, res, next) => {
    const options = {
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/gmail.settings.basic',
        'https://www.googleapis.com/auth/gmail.modify'
      ]
    }

    if (req.query && req.query.consent) {
      options.prompt = 'consent'
    }

    passport.authenticate('google-oauth2', options)(req, res, next)
  })

  server.get(
    '/auth/google/callback',
    passport.authenticate('google-oauth2', {
      failureRedirect: '/login'
    }),
    (req, res) => {
      User.findById(req.user.id, 'googleToken')
        .then(user => {
          if (!user.googleToken || !user.googleToken.refresh_token) {
            req.logout()
            res.redirect('/login?consent=1')
          } else {
            req.session.save(() => {
              res.redirect('/')
            })
          }
        })
        .catch(err => {
          console.log(err)
          req.logout()
          res.redirect('/login')
        })
    }
  )

  server.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/login')
  })
}
