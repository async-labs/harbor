import React from 'react'
import PropTypes from 'prop-types'
import Head from 'next/head'
import debounce from 'lodash/debounce'

import InfoOutline from 'material-ui-icons/InfoOutline'
import Launch from 'material-ui-icons/Launch'
import Paper from 'material-ui/Paper'
import Button from 'material-ui/Button'

import DescriptionEditor from '../components/DescriptionEditor'
import CopyButton from '../components/CopyButton'
import Modal from '../components/Modal'
import Toggle from '../components/Toggle'
import SelectList from '../components/SelectList'
import { styleExternalLinkIcon, styleFlatButton } from '../components/SharedStyles'

import withAuth from '../lib/withAuth'
import withLayout from '../lib/withLayout'
import {
  changePrice,
  changeDescription,
  changePageStatus,
  updateProfile,
  checkLabelsAndFilters
} from '../lib/api'
import { success, error } from '../lib/notifier'
import getRootURL from '../lib/getRootURL'

const stylePaper = {
  padding: '1px 20px 20px 20px',
  margin: '20px 0px'
}

const styleSectionSettings = {
  textAlign: 'left',
  fontWeight: '400'
}

class Index extends React.Component {
  static propTypes = {
    user: PropTypes.shape({
      price: PropTypes.number,
      description: PropTypes.string,
      isStripeConnected: PropTypes.bool,
      isMentorPagePublic: PropTypes.bool
    }).isRequired
  }

  constructor(props, ...args) {
    super(props, ...args)

    this.state = {
      description: (props.user && props.user.description) || '',
      descriptionLength:
        (props.user && props.user.description && props.user.description.length) || 0,
      status: !!props.user && !!props.user.isMentorPagePublic
    }

    this.saveDescription = debounce(() => {
      changeDescription(this.editor.editorDiv.elm.innerHTML)
        .then(() => success('Saved'))
        .catch(err => error(err))
    }, 500)
  }

  onUpdateProfileClicked = () => {
    updateProfile()
      .then(() => success('Successfuly updated'))
      .catch(err => error(err))
  }

  checkLabelsAndFilters = () => {
    checkLabelsAndFilters()
      .then(() => success('Successfuly updated'))
      .catch(err => error(err))
  }

  changePrice = value => {
    this.setState({ price: Number(value) })
    changePrice(value)
      .then(() => success('Saved'))
      .catch(err => error(err))
  }

  changePageStatus = e => {
    this.setState({ status: e.target.checked })
    changePageStatus(e.target.checked)
      .then(() => success(this.state.status ? 'Saved' : 'Saved'))
      .catch(err => error(err))
  }

  render() {
    const { user } = this.props

    const price = this.state.price || user.price
    const status = this.state.status
    const description = this.state.description
    const label = this.state.status ? 'Page is published' : 'Page is unpublished'
    const options = ['$25', '$50', '$100']
    const values = ['25', '50', '100']

    const optionsModal = [
      '- Share your link on social media.',
      '- Add your link to your website, blog, book.',
      '- Send your link to people who email you for advice.',
      '- Email your link to newsletter subscribers or customers.',
      '- Include your link in your signature and auto-reply email.'
    ]

    const secondary = ` : You get paid $${price * 0.9}`

    return (
      <div style={{ padding: '10px 45px' }}>
        <Head>
          <title>Settings on Harbor</title>
          <meta
            name="description"
            content="Set price and description on your public Harbor page."
          />
        </Head>
        {!user.isStripeConnected ? (
          <p>
            <span style={{ fontWeight: '600' }}>IMPORTANT</span>: Connect your Stripe account to
            make your Harbor page public and to receive payments instantly.
          </p>
        ) : (
          <p />
        )}

        <Paper style={stylePaper}>
          <h4 style={styleSectionSettings}>
            Your Harbor page
            <InfoOutline
              style={styleExternalLinkIcon}
              onClick={() => success('Share this page with people who seek your advice.')}
            />
          </h4>
          <a href={`/contact/${user.slug}`} target="_blank" rel="noopener noreferrer">
            {getRootURL()}/contact/{user.slug}
            <Launch style={styleExternalLinkIcon} />
          </a>
          <CopyButton buttonText="Copy URL" content={`${getRootURL()}/contact/${user.slug}`} />
          <p />
          <Modal
            linkText="Tips to promote your page"
            title="Tips to promote your page"
            options={optionsModal}
          />
        </Paper>

        <Paper style={stylePaper}>
          <h4 style={styleSectionSettings}>
            Price
            <InfoOutline
              style={styleExternalLinkIcon}
              onClick={() => success('Select a price for one email reply.')}
            />
          </h4>
          <SelectList
            options={options}
            values={values}
            selectedIndex={values.indexOf(`${price}`)}
            secondary={secondary}
            onClick={this.changePrice}
          />
        </Paper>

        <Paper style={stylePaper}>
          <h4 style={styleSectionSettings}>
            Description
            <InfoOutline
              style={styleExternalLinkIcon}
              onClick={() => success('Describe yourself and the type of advice you offer.')}
            />
          </h4>
          <DescriptionEditor
            defaultValue={description || 'Type description here...'}
            onRendered={comp => {
              this.setState({
                descriptionLength: comp.editorDiv.elm.innerText.length
              })
            }}
            ref={elm => {
              this.editor = elm
            }}
            onChange={e => {
              if (e.target.innerText.length <= 250) {
                this.setState({ description: e.target.innerHTML })
                this.setState({ descriptionLength: e.target.innerText.length })
                this.saveDescription()
              } else {
                error('Description should be 250 characters or less.')
              }
            }}
          />
          <p style={{ textAlign: 'left', fontSize: '12px', opacity: '1.0', marginTop: '0px' }}>
            {this.state.descriptionLength} / 250
          </p>
        </Paper>

        <Paper style={stylePaper}>
          <h4 style={styleSectionSettings}>
            Name and Avatar
            <InfoOutline
              style={styleExternalLinkIcon}
              onClick={() => success('Sync your current name and avatar with your Google profile.')}
            />
          </h4>
          <Button raised style={styleFlatButton} onClick={this.onUpdateProfileClicked}>
            Sync Name and Avatar
          </Button>
        </Paper>

        <Paper style={stylePaper}>
          <h4 style={styleSectionSettings}>
            Labels and Filters
            <InfoOutline
              style={styleExternalLinkIcon}
              onClick={() =>
                success(
                  'Regenerate Harbor labels and filters in your Gmail in case you deleted them by accident.'
                )}
            />
          </h4>
          <Button raised style={styleFlatButton} onClick={this.checkLabelsAndFilters}>
            Regenerate Labels and Filters in Gmail
          </Button>
        </Paper>

        {user.isStripeConnected ? (
          <Paper style={stylePaper}>
            <h4 style={styleSectionSettings}>
              Unpublish Harbor page
              <InfoOutline
                style={styleExternalLinkIcon}
                onClick={() =>
                  success(
                    'If your page is unpublished, advice seekers will not be able to email you via Harbor.'
                  )}
              />
              &nbsp;&nbsp;(DANGER ZONE)
            </h4>
            <div>
              <p />
              <Toggle checked={status} onChange={this.changePageStatus} label={label} />
            </div>
          </Paper>
        ) : null}

        <Paper style={{ ...stylePaper, display: 'none' }}>
          <h4 style={styleSectionSettings}>
            Revoke access to Gmail
            <InfoOutline
              style={styleExternalLinkIcon}
              onClick={() =>
                success(
                  'If access is revoked, you will not be able to receive payment for your advice.'
                )}
            />
            &nbsp;&nbsp;(DANGER ZONE)
          </h4>
          <Button raised style={styleFlatButton} onClick={this.onUpdateProfileClicked}>
            Revoke Gmail access
          </Button>
        </Paper>
      </div>
    )
  }
}

export default withAuth(withLayout(Index))
