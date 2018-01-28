// shared style

const styleToolbar = {
  background: '#FFF',
  height: '64px',
  paddingRight: '20px'
}

const styleMainNavLink = {
  margin: '0px 20px'
}

const mentorHeaderPic = {
  borderRadius: '50%',
  width: '42px',
  height: '42px',
  margin: '3px 0px 0px 0px'
}

const mentorPagePic = {
  borderRadius: '50%',
  width: '72px',
  height: '72px',
  margin: '15px 5px 0px'
}

const styleExternalLinkIcon = {
  width: '16px',
  opacity: '0.7',
  verticalAlign: 'middle',
  margin: '0px 0px 3px 4px'
}

const styleFlatButton = {
  borderRadius: '2px',
  textTransform: 'none',
  font: '15px Muli',
  fontWeight: '400',
  letterSpacing: '0.01em',
  color: '#0D47A1',
  backgroundColor: 'transparent'
}

const styleRaisedButton = {
  borderRadius: '2px',
  textTransform: 'none',
  font: '15px Muli',
  fontWeight: '600',
  letterSpacing: '0.01em',
  color: 'white',
  backgroundColor: '#0D47A1',
  '&:hover': {
    backgroundColor: 'white'
  }
}

const styleLoginButton = {
  borderRadius: '2px',
  textTransform: 'none',
  font: '15px Muli',
  fontWeight: '600',
  letterSpacing: '0.01em',
  color: 'white',
  backgroundColor: '#DF4930'
}

const styleRaisedFullWidthButton = {
  borderRadius: '2px',
  textTransform: 'none',
  font: '16px Muli',
  fontWeight: '300',
  letterSpacing: '0.01em',
  color: 'white',
  backgroundColor: '#1a237e',
  width: '100%',
  margin: '20px auto',
  '&:hover': {
    backgroundColor: 'white'
  }
}

const styleTextField = {
  font: '15px Muli',
  color: '#222',
  fontWeight: '300'
}

const styleForm = {
  margin: '7% auto',
  width: '360px'
}

const styleMainDiv = {
  width: '90%',
  margin: '25px auto'
}

const styleTextCenter = {
  textAlign: 'right'
}

module.exports = {
  styleToolbar,
  styleMainNavLink,
  mentorHeaderPic,
  mentorPagePic,
  styleExternalLinkIcon,
  styleFlatButton,
  styleRaisedButton,
  styleLoginButton,
  styleRaisedFullWidthButton,
  styleTextField,
  styleForm,
  styleMainDiv,
  styleTextCenter
}
