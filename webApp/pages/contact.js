/* globals StripePublishableKey */

import { Component } from 'react'
import PropTypes from 'prop-types'
import Head from 'next/head'
import StripeCheckout from 'react-stripe-checkout'
import 'isomorphic-fetch'
import Error from 'next/error'

import Grid from 'material-ui/Grid'
import Paper from 'material-ui/Paper'
import TextField from 'material-ui/TextField'
import Button from 'material-ui/Button'
import List, { ListItem } from 'material-ui/List'
import Divider from 'material-ui/Divider'

import { error, success } from '../lib/notifier'
import getRootURL from '../lib/getRootURL'
import withAuth from '../lib/withAuth'
import withLayout from '../lib/withLayout'

import { mentorPagePic, styleTextField } from '../components/SharedStyles'

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
  backgroundColor: '#1a237e',
  '&:hover': {
    backgroundColor: 'white'
  }
}

const styleListItem = {
  display: 'block',
  textAlign: 'center'
}

const styleStats = {
  fontWeight: '300',
  margin: '0px'
}

const styleSectionSettings = {
  fontWeight: '300',
  margin: '25px 0px 10px 0px'
}

class Mentor extends Component {
  static propTypes = {
    mentor: PropTypes.shape({
      _id: PropTypes.string.isRequired
    }),
    user: PropTypes.shape({
      _id: PropTypes.string.isRequired
    })
  }

  static defaultProps = {
    mentor: null,
    user: null
  }

  static async getInitialProps({ req, query }) {
    let url = `/public-api/v1/get-mentor-detail/${query.slug}`

    if (req) {
      url = `${getRootURL()}${url}`
    }

    const res = await fetch(url)
    const json = await res.json()

    if (json.error) {
      return { mentor: null }
    }
    return { mentor: json }
  }

  state = {
    subject: '',
    message: ''
  }

  componentDidMount() {
    // const stripeToken = {
    //   card: {
    //     brand: 'Visa',
    //     exp_month: 12,
    //     exp_year: 2021,
    //     id: 'card_1Aby7YGZO3FgrOB',
    //     last4: '4242'
    //   },
    //   email: 'pdelgermurun@gmail.com',
    //   id: 'tok_1Aby7YGZO3FgrO6o'
    // }
    // const url = '/public-api/v1/save-payment-card'
    // fetch(url, {
    //   method: 'POST',
    //   headers: {
    //     'Content-type': 'application/json; charset=UTF-8'
    //   },
    //   body: JSON.stringify({ stripeToken, mentorId: this.props.mentor._id })
    // })
    //   .then(response => response.json())
    //   .then(data => {
    //     console.log(data)
    //   })
  }

  onToken = token => {
    const { subject, message } = this.state
    const { mentor } = this.props

    if (!mentor.isStripeConnected) {
      error('Mentor has not connected Stripe account.')
      return
    }

    const url = '/public-api/v1/create-payment'

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json; charset=UTF-8'
      },
      body: JSON.stringify({
        stripeToken: token,
        mentorId: this.props.mentor._id,
        email: { subject, message }
      })
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          error(data.error)
        } else {
          success('Success! Email is sent.')
          this.setState({ subject: '', message: '' })
        }
      })
      .catch(err => error(err))
  }

  onStripeCheckoutClicked = e => {
    const { subject, message } = this.state

    if (!subject || !message) {
      e.stopPropagation()
      error('Please fill out both Subject and Message.')
    }

    if (message.length > 1000) {
      e.stopPropagation()
      error('Message should be 1000 characters or less.')
    }
  }

  renderEmailForm() {
    return (
      <div>
        <TextField
          value={this.state.subject}
          onChange={e => this.setState({ subject: e.target.value })}
          type="text"
          label="Subject"
          labelClassName="textFieldLabel"
          InputClassName="textFieldInput"
          style={styleTextField}
          required
        />
        <br />
        <br />
        <TextField
          value={this.state.message}
          onChange={e => {
            if (e.target.value.length <= 1000) {
              this.setState({ message: e.target.value })
            }
          }}
          type="text"
          label="Message"
          placeholder="Message should be 1000 characters or less."
          labelClassName="textFieldLabel"
          InputClassName="textFieldInput"
          style={styleTextField}
          fullWidth
          multiline
          rows="8"
          required
        />
        <span style={{ float: 'left', fontSize: '12px', opacity: '1.0' }}>
          {this.state.message.length} / 1000
        </span>
      </div>
    )
  }

  render() {
    const { mentor, user } = this.props
    const buttonStripe = `Email ${mentor.displayName}`
    const descriptionStripe = `You pay $${mentor.price} only if I reply.`
    const rating = `${mentor.rating.totalCount === 0
      ? 100
      : Math.round(mentor.rating.recommendCount / mentor.rating.totalCount * 100)}`

    if (!mentor) {
      return <Error statusCode={404} />
    }

    if (
      (!mentor.isMentorPagePublic || !mentor.isStripeConnected) &&
      (!user || user._id !== mentor._id)
    ) {
      return <Error statusCode={404} />
    }

    return (
      <div style={{ padding: '5px 25px' }}>
        <Head>
          <title>Email {mentor.displayName} and ask for advice.</title>
          <meta
            name="description"
            content={`Contact ${mentor.displayName} directly. Ask for any business, startup, career or personal advice. Pay only when ${mentor.displayName} replies to you. `}
          />
        </Head>
        <br />
        <Grid style={styleGrid} container direction="row" justify="space-around" align="flex-start">
          <Grid
            item
            sm={4}
            xs={12}
            style={{
              textAlign: 'center'
            }}
          >
            <Paper className="paper" elevation={3}>
              <div>
                <img src={mentor.avatarUrl} style={mentorPagePic} alt="Avatar" />
                <h3 style={{ fontWeight: '300', marginTop: '10px' }}>{mentor.displayName}</h3>
              </div>
              <p />
              <p style={{ textAlign: 'justify' }}>
                {mentor.description ? (
                  <span dangerouslySetInnerHTML={{ __html: mentor.description }} />
                ) : (
                  `${mentor.displayName} has not added description yet.`
                )}
              </p>

              {mentor.links && mentor.links.length > 0 ? (
                <p style={{ textAlign: 'left' }}>
                  Sample email advice:{' '}
                  {mentor.links.map((l, i) => (
                    <span key={l.url}>
                      {i !== 0 ? ', ' : null}
                      <a href={l.url} target="_blank" rel="noopener noreferrer">
                        {l.title}
                      </a>
                    </span>
                  ))}
                </p>
              ) : null}
              <div>
                <List>
                  <ListItem style={styleListItem} divider>
                    <h3 style={styleStats}>{rating}%&nbsp;</h3>
                    <h5 style={styleStats}>of people recommend</h5>
                  </ListItem>

                  <ListItem style={styleListItem} divider>
                    <h3 style={styleStats}>{mentor.repliedCount}&nbsp;</h3>
                    <h5 style={styleStats}>email{mentor.repliedCount === 1 ? '' : 's'} sent</h5>
                  </ListItem>

                  <ListItem style={styleListItem}>
                    <h3 style={styleStats}>
                      &lt;{mentor.averageResponseTime} hour{mentor.averageResponseTime === 1 ? '' : 's'}&nbsp;
                    </h3>
                    <h5 style={styleStats}>average reply time</h5>
                  </ListItem>
                </List>
              </div>
            </Paper>
          </Grid>
          <Grid
            item
            sm={8}
            xs={12}
            style={{
              textAlign: 'left'
            }}
          >
            <Paper className="paper" elevation={3}>
              <div>
                <h3 style={styleSectionSettings}>Ask {mentor.displayName} for advice</h3>
                <ul>
                  <li>
                    Step 1: Write a subject line and message for your email to {mentor.displayName}.
                  </li>
                  <li>Step 2: Enter your email address and add your payment information.</li>
                  <li>
                    Step 3: Verify your payment information and email {mentor.displayName}. You’ll
                    be cc’d on the email.
                  </li>
                </ul>
                <p style={{ fontWeight: '400' }}>
                  This advice costs ${mentor.price}. You'll only be charged if {mentor.displayName}{' '}
                  replies.
                </p>
              </div>
              <Divider light />
              <div>
                <h3 style={styleSectionSettings}>Compose message</h3>
              </div>
              {this.renderEmailForm()}
              <br />
              <div style={{ textAlign: 'right' }}>
                <StripeCheckout
                  stripeKey={StripePublishableKey}
                  token={this.onToken}
                  name={mentor.displayName}
                  image={mentor.avatarUrl}
                  description={descriptionStripe}
                  panelLabel={buttonStripe}
                >
                  <Button onClick={this.onStripeCheckoutClicked} style={styleNextButton}>
                    Next
                  </Button>
                </StripeCheckout>
              </div>
              <br />
            </Paper>
          </Grid>
        </Grid>
      </div>
    )
  }
}

export default withAuth(withLayout(Mentor, { noHeader: true }), { loginRequired: false })
