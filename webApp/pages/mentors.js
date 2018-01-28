import { Component } from 'react'
import PropTypes from 'prop-types'
import Head from 'next/head'
import Error from 'next/error'

import Grid from 'material-ui/Grid'
import Table, { TableBody, TableCell, TableHead, TableRow } from 'material-ui/Table'

import { error } from '../lib/notifier'
import withAuth from '../lib/withAuth'
import withLayout from '../lib/withLayout'
import { getMentorList } from '../lib/api'

const styleGrid = {
  flexGrow: '1'
}

const UI = ({ mentors }) => (
  <div style={{ padding: '10px 45px' }}>
    <Head>
      <title>Mentors on Harbor</title>
    </Head>
    <br />

    <Grid style={styleGrid} container direction="row" justify="space-around" align="flex-start">
      <Table style={{ fontFamily: 'Muli' }}>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell numeric>
              Stripe status, Price, Number of Advice, Rating, Response Time
            </TableCell>
            <TableCell>Description</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {mentors.map(m => {
            const rating =
              !m.rating || m.rating.totalCount === 0
                ? 100
                : Math.round(m.rating.recommendCount / m.rating.totalCount * 100)

            return (
              <TableRow key={m._id}>
                <TableCell>
                  <a href={`/contact/${m.slug}`} target="_blank" rel="noopener noreferrer">
                    {m.displayName}
                  </a>{' '}
                  | {m.email}
                </TableCell>

                <TableCell numeric>
                  {m.isStripeConnected === true ? 'yes' : 'no'}, ${m.price}, {m.repliedCount}{' '}
                  replies, {rating}%, {m.averageResponseTime} hour{m.averageResponseTime === 1 ? '' : 's'}
                </TableCell>
                <TableCell>
                  <span dangerouslySetInnerHTML={{ __html: m.description }} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Grid>
  </div>
)

UI.propTypes = {
  mentors: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string
    })
  ).isRequired
}

class Mentors extends Component {
  static propTypes = {
    user: PropTypes.shape({
      isAdmin: PropTypes.bool
    })
  }

  static defaultProps = {
    user: null
  }

  static async getInitialProps({ query }) {
    return query
  }

  state = {
    mentors: []
  }

  componentDidMount() {
    getMentorList()
      .then(mentors => this.setState({ mentors }))
      .catch(err => error(err))
  }

  render() {
    const { user } = this.props
    const { mentors } = this.state

    if (!user || !user.isAdmin) {
      return <Error statusCode={404} />
    }

    const UIwithLayout = withLayout(UI)

    return <UIwithLayout mentors={mentors} {...this.props} />
  }
}

export default withAuth(Mentors)
