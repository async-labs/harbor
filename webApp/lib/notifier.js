import { openSnackbar } from '../components/Notifier'

export function success(message) {
  openSnackbar({ message, type: 'success' })
}

export function error(err) {
  openSnackbar({ message: err.message || err.toString(), type: 'error' })
}
