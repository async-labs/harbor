import PropTypes from 'prop-types'
import Link from 'next/link'
import Router from 'next/router'
import NProgress from 'nprogress'
import Launch from 'material-ui-icons/Launch'
import Toolbar from 'material-ui/Toolbar'
import Grid from 'material-ui/Grid'
import Hidden from 'material-ui/Hidden'
import Button from 'material-ui/Button'
import MenuDrop from './MenuDrop'
import Income from './IncomeReport'

import {
  styleFlatButton,
  styleRaisedButton,
  styleToolbar,
  styleExternalLinkIcon
} from './SharedStyles'

Router.onRouteChangeStart = () => {
  NProgress.start()
}
Router.onRouteChangeComplete = () => NProgress.done()
Router.onRouteChangeError = () => NProgress.done()

const optionsMenu = [
  {
    text: 'Send feedback',
    url: 'https://mail.google.com/mail/?view=cm&fs=1&to=team@findharbor.com',
    target: '_blank',
    rel: 'noopener noreferrer'
  },
  { text: 'Log out', url: '/logout', target: '_self', rel: null }
]

function Header({ user }) {
  if (user) {
    return (
      <div>
        <Toolbar style={styleToolbar}>
          <Grid container direction="row" justify="space-around" align="center">
            <Grid item sm={5} xs={1} style={{ textAlign: 'left' }}>
              <Hidden smDown>
                <Link href="/">
                  <a>Settings</a>
                </Link>
              </Hidden>{' '}
              <Hidden smDown>
                {user.isAdmin ? (
                  <Link href="/mentors">
                    <a style={{ marginLeft: '20px' }}>Mentors</a>
                  </Link>
                ) : null}
              </Hidden>{' '}
            </Grid>
            <Grid item sm={6} xs={9} style={{ textAlign: 'right' }}>
              {!user.isStripeConnected ? (
                <div>
                  <a href="/auth/stripe">
                    <Button style={styleRaisedButton} className="classFlatButton">
                      Connect Stripe
                    </Button>
                  </a>
                </div>
              ) : (
                <div>
                  <Income />
                  <Hidden smDown>
                    <a
                      href="https://dashboard.stripe.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Stripe<Launch style={styleExternalLinkIcon} />
                    </a>
                  </Hidden>
                </div>
              )}
            </Grid>
            <Grid item sm={1} xs={2} style={{ textAlign: 'right' }}>
              <div style={{ whiteSpace: ' nowrap' }}>
                {user.avatarUrl ? (
                  <MenuDrop options={optionsMenu} src={user.avatarUrl} alt={user.displayName} />
                ) : null}
              </div>
            </Grid>
          </Grid>
        </Toolbar>
      </div>
    )
  }

  return (
    <div>
      <Toolbar style={styleToolbar}>
        <Grid container direction="row" justify="space-around" align="center">
          <Grid item xs={12} style={{ textAlign: 'right' }}>
            <Link prefetch href="/login">
              <Button style={styleFlatButton} className="classFlatButton">
                Log in
              </Button>
            </Link>
            <Link prefetch href="/signup">
              <Button style={styleFlatButton} className="classFlatButton">
                Sign up
              </Button>
            </Link>
          </Grid>
        </Grid>
      </Toolbar>
    </div>
  )
}

Header.propTypes = {
  user: PropTypes.shape({
    displayName: PropTypes.string,
    email: PropTypes.string.isRequired
  })
}

Header.defaultProps = {
  user: null
}

export default Header
