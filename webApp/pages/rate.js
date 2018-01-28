import { Component } from 'react'
import Error from 'next/error'
import PropTypes from 'prop-types'

import withLayout from '../lib/withLayout'

class Rate extends Component {
  static propTypes = {
    error: PropTypes.string,
    mentorName: PropTypes.string
  }

  static defaultProps = {
    error: null,
    mentorName: null
  }

  static async getInitialProps({ req, query }) {
    if (!req) {
      return { error: 'Not found' }
    }
    const { error, mentorName } = query || {}

    return { error: error ? error.message || error.toString() : null, mentorName }
  }

  render() {
    const { error, mentorName } = this.props

    if (error === 'Not found') {
      return <Error statusCode={404} />
    }

    if (error) {
      return (
        <div style={{ textAlign: 'center', margin: '0 20px' }}>
          <br />
          <br />
          <br />
          <h1>
            {error}
          </h1>
          <br />
        </div>
      )
    }

    return (
      <div style={{ textAlign: 'center', margin: '0 20px' }}>
        <br />
        <br />
        <br />
        <h1>
          Thank you for rating {mentorName}&#39;s advice.
        </h1>
        <br />
      </div>
    )
  }
}

export default withLayout(Rate, { noHeader: true })
