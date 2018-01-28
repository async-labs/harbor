/* globals StripePublishableKey */

import { Component } from 'react'
import PropTypes from 'prop-types'
import StripeCheckout from 'react-stripe-checkout'
import 'isomorphic-fetch'
import Error from 'next/error'

import Grid from 'material-ui/Grid'
import Button from 'material-ui/Button'

import { error, success } from '../lib/notifier'
import withLayout from '../lib/withLayout'

const styleGrid = {
  flexGrow: '1'
}

const styleNextButton = {
  borderRadius: '2px',
  textTransform: 'none',
  font: '15px Muli',
  fontWeight: '600',
  letterSpacing: '0.01em',
  color: 'white',
  backgroundColor: '#0D47A1',
  '&:hover': {
    backgroundColor: 'white'
  },
  display: 'none'
}

class Checkout extends Component {
  static propTypes = {
    mentor: PropTypes.shape({}),
    payment: PropTypes.shape({})
  }

  static defaultProps = {
    mentor: null,
    payment: null
  }

  static async getInitialProps({ query }) {
    return query
  }

  onToken = token => {
    const { mentor, payment } = this.props

    if (!mentor.isStripeConnected) {
      error('Mentor has not connected Stripe account.')
      return
    }

    const url = `/public-api/v1/pay-payment/${payment._id}`

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json; charset=UTF-8'
      },
      body: JSON.stringify({
        stripeToken: token
      })
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          error(data.error)
        } else {
          success('Success! Payment is sent, now you can send emails via Harbor again.')
        }
      })
      .catch(err => error(err))
  }

  render() {
    const { payment, mentor } = this.props
    if (!payment) {
      return <Error statusCode={404} />
    }

    const descriptionStripe = `Pay $${payment.amount} to ${mentor.displayName}.`
    const buttonStripe = `Pay $${payment.amount} to ${mentor.displayName}`

    return (
      <div style={{ padding: '5px 25px' }}>
        <br />
        <Grid style={styleGrid} container direction="row" justify="space-around" align="flex-start">
          <Grid
            item
            sm={12}
            xs={12}
            style={{
              textAlign: 'left'
            }}
          >
            <div style={{ textAlign: 'center', marginTop: '100px' }}>
              <StripeCheckout
                stripeKey={StripePublishableKey}
                token={this.onToken}
                name={mentor.displayName}
                image={mentor.avatarUrl}
                description={descriptionStripe}
                desktopShowModal
                panelLabel={buttonStripe}
              >
                <Button style={styleNextButton}>
                  Pay ${payment.amount} for advice you received from {mentor.displayName}
                </Button>
              </StripeCheckout>
            </div>
            <br />
          </Grid>
        </Grid>
      </div>
    )
  }
}

export default withLayout(Checkout, { noHeader: true })
