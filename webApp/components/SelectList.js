import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withStyles } from 'material-ui/styles'
import List, { ListItem, ListItemText } from 'material-ui/List'
import Menu, { MenuItem } from 'material-ui/Menu'
import KeyboardArrowDown from 'material-ui-icons/KeyboardArrowDown'

const styleSheet = {
  root: {
    width: '100%',
    maxWidth: '200px',
    textAlign: 'right',
    backgroundColor: 'white'
  },
  List: {
    padding: '0px',
    border: '1px solid rgba(26, 35, 126, 0.25)',
    marginBottom: '5px'
  },
  MenuItem: {
    font: '14px Muli',
    fontWeight: '400'
  },
  ListItem: {
    padding: '8px 5px',
    textAlign: 'center'
  },
  ListItemText: {
    font: '14px Muli',
    fontWeight: '300',
    padding: '0px 5px'
  }
}

class SelectMenuList extends Component {
  static propTypes = {
    options: PropTypes.arrayOf(String).isRequired,
    values: PropTypes.arrayOf(String),
    onClick: PropTypes.func,
    secondary: PropTypes.string.isRequired,
    classes: PropTypes.shape({}).isRequired,
    selectedIndex: PropTypes.number
  }

  static defaultProps = {
    values: null,
    selectedIndex: null,
    onClick: null
  }

  state = {
    anchorEl: undefined,
    open: false,
    selectedIndex: 0
  }

  button = undefined

  handleClickListItem = event => {
    this.setState({ open: true, anchorEl: event.currentTarget })
  }

  handleMenuItemClick = (event, index) => {
    this.setState({ selectedIndex: index, open: false })
    const { onClick, values } = this.props

    if (onClick && values) {
      onClick(values[index])
    }
  }

  handleRequestClose = () => {
    this.setState({ open: false })
  }

  render() {
    const classes = this.props.classes
    const options = this.props.options

    const { secondary } = this.props
    const selectedIndex = this.props.selectedIndex || this.state.selectedIndex

    return (
      <div className={classes.root}>
        <List className={classes.List}>
          <ListItem
            className={classes.ListItem}
            button
            aria-haspopup="true"
            aria-controls="lock-menu"
            onClick={this.handleClickListItem}
          >
            <ListItemText
              className={classes.ListItemText}
              primary={options[selectedIndex]}
              secondary={secondary}
              disableTypography
            />
            <KeyboardArrowDown style={{ color: '#666' }} />
          </ListItem>
        </List>
        <Menu
          id="lock-menu"
          anchorEl={this.state.anchorEl}
          open={this.state.open}
          onRequestClose={this.handleRequestClose}
        >
          {options.map((option, index) => (
            <MenuItem
              className={classes.MenuItem}
              key={option}
              selected={index === selectedIndex}
              onClick={event => this.handleMenuItemClick(event, index)}
            >
              {option}
            </MenuItem>
          ))}
        </Menu>
      </div>
    )
  }
}

const SelectMenuListWithStyle = withStyles(styleSheet)(SelectMenuList)

const SelectList = ({ options, values, onClick, secondary, selectedIndex }) => (
  <SelectMenuListWithStyle
    options={options}
    values={values}
    onClick={onClick}
    secondary={secondary}
    selectedIndex={selectedIndex}
  />
)

SelectList.propTypes = {
  options: PropTypes.arrayOf(String).isRequired,
  values: PropTypes.arrayOf(String).isRequired,
  onClick: PropTypes.func.isRequired,
  secondary: PropTypes.string.isRequired,
  selectedIndex: PropTypes.number.isRequired
}

export default SelectList
