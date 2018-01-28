import React from 'react'
import PropTypes from 'prop-types'
import { FormControlLabel } from 'material-ui/Form'
import Switch from 'material-ui/Switch'

const Toggle = ({ checked, onChange, label }) =>
  (<div style={{ font: 'Muli 15px' }}>
    <FormControlLabel
      control={
        <Switch
          checked={checked}
          // onChange={(event, checked) => this.setState({ checked: checked })}
          onChange={onChange}
        />
      }
      label={label}
    />
  </div>)

Toggle.propTypes = {
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired
}

export default Toggle
