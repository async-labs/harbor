import { Component } from 'react'
import Snackbar from 'material-ui/Snackbar'

let openSnackbarFn

class Notifier extends Component {
  state = {
    open: false,
    type: 'success',
    message: ''
  }

  componentDidMount() {
    openSnackbarFn = this.openSnackbar
  }

  handleSnackbarRequestClose = () => {
    this.setState({
      open: false,
      message: '',
      type: 'success'
    })
  }

  openSnackbar = ({ message, type }) => {
    this.setState({ open: true, message, type })
  }

  render() {
    const message = (
      <span id="snackbar-message-id" dangerouslySetInnerHTML={{ __html: this.state.message }} />
    )

    return (
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        message={message}
        autoHideDuration={8000}
        onRequestClose={this.handleSnackbarRequestClose}
        open={this.state.open}
        SnackbarContentProps={{
          'aria-describedby': 'snackbar-message-id'
        }}
      />
    )
  }
}

export function openSnackbar({ message, type }) {
  openSnackbarFn({ message, type })
}

export default Notifier
