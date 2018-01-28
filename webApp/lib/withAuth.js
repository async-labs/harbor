import React from 'react'
import PropTypes from 'prop-types'
import Router from 'next/router'

let globalUser = null

export function updateUser({ price, description, isMentorPagePublic }) {
  if (globalUser) {
    if (price) {
      globalUser.price = Number(price)
    }

    if (description) {
      globalUser.description = description
    }

    if (isMentorPagePublic !== undefined) {
      globalUser.isMentorPagePublic = isMentorPagePublic
    }
  }
}

export default (Page, { loginRequired = true, logoutRequired = false } = {}) =>
  class BaseComponent extends React.Component {
    static propTypes = {
      user: PropTypes.shape({
        displayName: PropTypes.string,
        email: PropTypes.string.isRequired
      }),
      isFromServer: PropTypes.bool.isRequired
    }

    static defaultProps = {
      user: null
    }

    static async getInitialProps(ctx) {
      const isFromServer = !!ctx.req
      const user = ctx.req ? ctx.req.user && ctx.req.user.toObject() : globalUser

      if (isFromServer && user) {
        user._id = user._id.toString()
      }

      const props = { user, isFromServer }

      if (Page.getInitialProps) {
        Object.assign(props, (await Page.getInitialProps(ctx)) || {})
      }

      return props
    }

    componentDidMount() {
      if (this.props.isFromServer) {
        globalUser = this.props.user
      }

      if (loginRequired && !logoutRequired && !this.props.user) {
        Router.push('/login')
        return
      }

      if (logoutRequired && this.props.user) {
        Router.push('/')
      }
    }

    render() {
      if (loginRequired && !logoutRequired && !this.props.user) {
        return null
      }

      if (logoutRequired && this.props.user) {
        return null
      }

      return <Page {...this.props} />
    }
  }
