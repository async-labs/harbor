import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Menu from 'material-ui/Menu'

import { mentorHeaderPic } from './SharedStyles'

class MenuDrop extends Component {
  static propTypes = {
    src: PropTypes.string.isRequired,
    alt: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(String).isRequired
  }

  state = {
    open: false,
    anchorEl: undefined
  }

  button = undefined

  handleClick = event => {
    this.setState({ open: true, anchorEl: event.currentTarget })
  }

  handleRequestClose = () => {
    this.setState({ open: false })
  }

  render() {
    const { options, src, alt } = this.props

    return (
      <div style={{ display: 'inline', whiteSpace: 'nowrap' }}>
        <img
          aria-owns="simple-menu"
          aria-haspopup="true"
          onClick={this.handleClick}
          src={src}
          alt={alt}
          style={mentorHeaderPic}
        />
        <Menu
          style={{ padding: '0px 20px' }}
          id="simple-menu"
          anchorEl={this.state.anchorEl}
          open={this.state.open}
          onRequestClose={this.handleRequestClose}
        >
          <p />
          {options.map(option => (
            <div id="wrappingLink" style={{ padding: '0px 15px' }} key={option.text}>
              <a
                href={option.url}
                onClick={this.handleRequestClose}
                target={option.target}
                rel={option.rel}
              >
                {option.text}
              </a>
              <p />
            </div>
          ))}
        </Menu>
      </div>
    )
  }
}

export default MenuDrop
