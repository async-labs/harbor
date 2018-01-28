import Head from 'next/head'
import Button from 'material-ui/Button'
import PropTypes from 'prop-types'

import withAuth from '../lib/withAuth'
import withLayout from '../lib/withLayout'
import { styleLoginButton } from '../components/SharedStyles'

const Login = props => (
  <div style={{ textAlign: 'center', margin: '0 20px' }}>
    <Head>
      <title>Log in to Harbor</title>
      <meta name="description" content="Login page for invited members only." />
    </Head>
    <br />
    <br />
    <br />
    <h1>Log in</h1>
    <p>You’ll be logged in for 14 days unless you log out manually.</p>
    <br />
    <Button
      style={styleLoginButton}
      className="classLoginButton"
      raised
      href={`/auth/google${props.url && props.url.query && props.url.query.consent
          ? '?consent=1'
          : ''}`}
    >
      <img src="https://storage.googleapis.com/nice-future-2156/G.svg" alt="Log in with Google" />
        &nbsp;&nbsp;&nbsp; Log in with Google
      </Button>
  </div>
  )
Login.propTypes = {
  url: PropTypes.shape({
    query: PropTypes.object
  }).isRequired
}

export default withAuth(withLayout(Login), { logoutRequired: true })
