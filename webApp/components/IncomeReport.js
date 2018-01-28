import React, { Component } from 'react'
import NProgress from 'nprogress'
import PropTypes from 'prop-types'
import { withStyles } from 'material-ui/styles'
import List, { ListItem, ListItemText } from 'material-ui/List'
import Menu, { MenuItem } from 'material-ui/Menu'
import KeyboardArrowDown from 'material-ui-icons/KeyboardArrowDown'
import { getIncomeReport } from '../lib/api'
import { error } from '../lib/notifier'

const styleSheet = {
  root: {
    width: '100%',
    maxWidth: '200px',
    display: 'inline-flex',
    marginRight: '20px',
    backgroundColor: '#F7F9FC'
  },
  List: {
    padding: '0px',
    border: '1px solid rgba(26, 35, 126, 0.25)'
  },
  MenuItem: {
    font: '14px Muli',
    fontWeight: '400'
  },
  ListItem: {
    padding: '2px 5px',
    textAlign: 'center'
  },
  ListItemText: {
    font: '14px Muli',
    fontWeight: '400',
    padding: '0px 5px'
  }
}

class IncomeReport extends Component {
  static propTypes = {
    classes: PropTypes.shape({}).isRequired
  }

  state = {
    anchorEl: undefined,
    open: false,
    selectedIndex: 0,
    loading: true,
    error: null,
    incomeList: []
  }

  componentDidMount() {
    NProgress.start()

    getIncomeReport()
      .then(({ incomeList }) => {
        this.setState({ incomeList, loading: false })
        NProgress.done()
      })
      .catch(err => {
        this.setState({ loading: false, error: err.message || err.toString() })
        error(err)
        NProgress.done()
      })
  }

  handleClickListItem = event => {
    this.setState({ open: true, anchorEl: event.currentTarget })
  }

  handleMenuItemClick = (event, index) => {
    this.setState({ selectedIndex: index, open: false })
  }

  handleRequestClose = () => {
    this.setState({ open: false })
  }

  render() {
    if (this.state.loading) {
      return null
    }

    if (this.state.error) {
      return <span>{this.state.error}</span>
    }

    const classes = this.props.classes

    const options = this.state.incomeList
    const selectedIndex = this.state.selectedIndex
    const selectedItem = options[selectedIndex]

    return (
      <div className={classes.root}>
        <List className={classes.List}>
          <ListItem
            className={classes.ListItem}
            aria-haspopup="true"
            aria-controls="income-report"
            onClick={this.handleClickListItem}
          >
            <ListItemText
              primary={`$${selectedItem.income} - ${selectedItem.month}`}
              className={classes.ListItemText}
              disableTypography
            />
            <KeyboardArrowDown style={{ color: '#666' }} />
          </ListItem>
        </List>
        <Menu
          id="income-report"
          anchorEl={this.state.anchorEl}
          open={this.state.open}
          onRequestClose={this.handleRequestClose}
        >
          {options.map((option, index) => (
            <MenuItem
              className={classes.MenuItem}
              key={option.month}
              selected={index === selectedIndex}
              onClick={event => this.handleMenuItemClick(event, index)}
            >
              ${option.income} in {option.month}
            </MenuItem>
          ))}
        </Menu>
      </div>
    )
  }
}

const IncomeReportWithStyle = withStyles(styleSheet)(IncomeReport)

const Income = () => <IncomeReportWithStyle />

export default Income
