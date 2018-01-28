import Head from 'next/head'
import Button from 'material-ui/Button'

import withAuth from '../lib/withAuth'
import withLayout from '../lib/withLayout'
import { styleLoginButton } from '../components/SharedStyles'

const Signup = () =>
  (<div style={{ textAlign: 'center', margin: '0 20px' }}>
    <Head>
      <title>Sign up on Harbor</title>
      <meta name="description" content="Signup page for invited members only." />
    </Head>
    <br />
    <br />
    <br />
    <h1>Sign up</h1>
    <p>
      By clicking the button below, you agree to Harbor’s
      <a
        href="https://www.findharbor.com/terms-of-service"
        target="_blank"
        rel="noopener noreferrer"
      >
        {' '}Terms of Service
      </a>{' '}
      and
      <a href="https://www.findharbor.com/privacy-policy" target="_blank" rel="noopener noreferrer">
        {' '}Privacy Policy
      </a>
      .
    </p>
    <br />
    <Button style={styleLoginButton} className="classLoginButton" raised href="/auth/google">
      <img src="https://storage.googleapis.com/nice-future-2156/G.svg" alt="Google" />
      &nbsp;&nbsp;&nbsp; Sign up with Google
    </Button>
    <br />
    <br />
    <p>We do not read your emails or save them to our database.</p>
  </div>)

export default withAuth(withLayout(Signup), { logoutRequired: true })
