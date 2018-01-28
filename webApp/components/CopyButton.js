import React from 'react'
import PropTypes from 'prop-types'
import ClipboardButton from 'react-clipboard.js'

import { success } from '../lib/notifier'

const styleCopyButton = {
  textTransform: 'none',
  font: '15px Muli',
  fontWeight: '300',
  letterSpacing: '0.01em',
  color: '#1F4167',
  backgroundColor: 'transparent',
  boxShadow: 'none',
  WebkitBoxShadow: 'none',
  MozBoxShadow: 'none',
  border: 'none',
  marginLeft: '25px',
  '&:hover': {
    opacity: '0.8'
  }
}

const CopyButton = ({ content, buttonText }) =>
  (<span>
    <ClipboardButton
      style={styleCopyButton}
      data-clipboard-text={content}
      onSuccess={() => success('Copied!')}
    >
      {buttonText}
    </ClipboardButton>
  </span>)

CopyButton.propTypes = {
  content: PropTypes.string.isRequired,
  buttonText: PropTypes.string.isRequired
}

export default CopyButton
