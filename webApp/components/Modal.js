import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withStyles } from 'material-ui/styles'
import List, { ListItem, ListItemText } from 'material-ui/List'
import Dialog, { DialogTitle } from 'material-ui/Dialog'
import Slide from 'material-ui/transitions/Slide'
import Button from 'material-ui/Button'

const styleRaisedButton = {
  borderRadius: '0px',
  textTransform: 'none',
  font: '15px Muli',
  fontWeight: '600',
  letterSpacing: '0.01em',
  color: 'white',
  backgroundColor: '#1a237e'
}

const styleSheet = {
  Dialog: {
    font: '15px Muli'
    // width: '360px'
  },
  DialogTitle: {
    font: '15px Muli',
    fontSize: '20px',
    fontWeight: '300',
    padding: '20px'
  },
  ListItemText: {
    font: '15px Muli',
    fontWeight: '300'
  }
}

const SimpleDialog = ({ options, classes, onRequestClose, title, ...other }) => (
  <Dialog
    onRequestClose={onRequestClose}
    {...other}
    className={classes.Dialog}
    transition={<Slide direction="right" />}
  >
    <DialogTitle disableTypography className={classes.DialogTitle}>
      {title}
    </DialogTitle>
    <div>
      <List style={{ padding: '0px 20px 20px 20px' }}>
        {options.map(option => (
          <ListItem key={option}>
            <ListItemText primary={option} disableTypography className={classes.ListItemText} />
          </ListItem>
        ))}
      </List>
      <div style={{ textAlign: 'center' }}>
        <Button raised onClick={onRequestClose} style={styleRaisedButton}>
          OK, got it
        </Button>
      </div>
    </div>
    <br />
  </Dialog>
)

SimpleDialog.propTypes = {
  options: PropTypes.arrayOf(String).isRequired,
  classes: PropTypes.shape({}).isRequired,
  onRequestClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired
}

const SimpleDialogWrapped = withStyles(styleSheet)(SimpleDialog)

class Modal extends Component {
  static propTypes = {
    linkText: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(String).isRequired
  }

  state = {
    open: false
  }

  handleRequestClose = () => {
    this.setState({ open: false })
  }

  render() {
    const { linkText, title } = this.props
    const options = this.props.options
    return (
      <span>
        <a
          style={{ fontWeight: '400', fontSize: '13px' }}
          href="#"
          onClick={() => this.setState({ open: true })}
        >
          {linkText}
        </a>
        <SimpleDialogWrapped
          open={this.state.open}
          onRequestClose={this.handleRequestClose}
          title={title}
          options={options}
        />
      </span>
    )
  }
}

export default Modal
