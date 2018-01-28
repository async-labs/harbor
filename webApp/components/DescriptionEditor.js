import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Link from 'material-ui-icons/Link'
import Button from 'material-ui/Button'
import Dialog, { DialogActions, DialogContent, DialogContentText } from 'material-ui/Dialog'

import { styleExternalLinkIcon, styleFlatButton } from '../components/SharedStyles'

import { error } from '../lib/notifier'

const styleTitle = {
  marginLeft: '25px',
  fontSize: '18px'
}

const styleDialogActions = {
  margin: '0px 20px 20px 0px'
}

function replaceSelectionWithHtml(html, range) {
  range.deleteContents()
  const div = document.createElement('div')
  div.innerHTML = html
  const frag = document.createDocumentFragment()

  let child = div.firstChild

  while (child) {
    frag.appendChild(child)
    child = div.firstChild
  }

  range.insertNode(frag)
}

class EditorDiv extends Component {
  static propTypes = {
    defaultValue: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired
  }

  shouldComponentUpdate() {
    return false
  }

  render() {
    const { defaultValue } = this.props

    return (
      <div
        role="presentation"
        style={{ padding: '8px 5px', border: '1px solid rgba(26, 35, 126, 0.25)' }}
        contentEditable
        dangerouslySetInnerHTML={{ __html: defaultValue }}
        onKeyDown={e => {
          const text = e.target.innerText

          if (e.which === 8 || e.ctrlKey) {
            return
          }

          if (text.length > 250) {
            e.preventDefault()
            error('Description should be 250 characters or less.')
          }
        }}
        onInput={e => {
          this.props.onChange(e)
        }}
        ref={elm => {
          this.elm = elm
        }}
      />
    )
  }
}

class DescriptionEditor extends Component {
  static propTypes = {
    defaultValue: PropTypes.string.isRequired,
    onRendered: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired
  }

  state = {
    insertLinkOpen: false
  }

  componentDidMount() {
    this.props.onRendered(this)
  }

  handleRequestClose = () => {
    this.setState({ insertLinkOpen: false })
  }

  handleOpenInsertLinkDialog = () => {
    const range = window.getSelection().getRangeAt(0)
    if (range.toString() === '') {
      error('Select text to hyperlink it.')
      return
    }

    this.range = range
    this.setState({ insertLinkOpen: true })
  }

  handleInsertLink = () => {
    const link = this.insertLinkInput.value
    if (link === '') {
      error('Add link')
      return
    }

    this.insertLinkInput.value = ''
    replaceSelectionWithHtml(
      `<a href="${link}" target="_blank" rel="noopener noreferrer">${this.range}</a>`,
      this.range,
      this.editorDiv.elm
    )

    this.props.onChange({ target: this.editorDiv.elm })
    this.setState({ insertLinkOpen: false })
  }

  render() {
    return (
      <div>
        <EditorDiv
          onChange={this.props.onChange}
          defaultValue={this.props.defaultValue}
          ref={elm => {
            this.editorDiv = elm
          }}
        />

        <Link style={styleExternalLinkIcon} onClick={this.handleOpenInsertLinkDialog} />

        <Dialog open={this.state.insertLinkOpen} onRequestClose={this.handleRequestClose}>
          <p style={styleTitle}>Add link</p>
          <DialogContent>
            <DialogContentText>
              <input
                ref={elm => {
                  this.insertLinkInput = elm
                }}
              />
            </DialogContentText>
          </DialogContent>
          <DialogActions style={styleDialogActions}>
            <Button raised style={styleFlatButton} onClick={this.handleRequestClose}>
              Cancel
            </Button>
            <Button raised style={styleFlatButton} onClick={this.handleInsertLink}>
              Add
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    )
  }
}

export default DescriptionEditor
