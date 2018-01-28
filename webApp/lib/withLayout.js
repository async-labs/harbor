import React from 'react'
import { withStyles, MuiThemeProvider } from 'material-ui/styles'
import getContext from '../lib/context'

import Router from 'next/router'

import Header from '../components/Header'
import Notifier from '../components/Notifier'

Router.onAppUpdated = function onAppUpdated(nextRoute) {
  location.href = nextRoute
}

const styles = theme => ({
  '@global': {
    html: {
      WebkitFontSmoothing: 'antialiased', // Antialiasing.
      MozOsxFontSmoothing: 'grayscale' // Antialiasing.
    },
    body: {
      font: '15px Muli',
      color: '#222',
      margin: '0px auto',
      fontWeight: '300',
      lineHeight: '1.5em',
      backgroundColor: '#F7F9FC'
    },
    span: {
      fontFamily: 'Muli !important'
    }
  }
})

let AppWrapper = props => props.children

AppWrapper = withStyles(styles)(AppWrapper)

function withLayout(BaseComponent, { noHeader = false } = {}) {
  class App extends React.Component {
    static getInitialProps(ctx) {
      if (BaseComponent.getInitialProps) {
        return BaseComponent.getInitialProps(ctx)
      }

      return {}
    }

    componentWillMount() {
      this.styleContext = getContext()
    }

    componentDidMount() {
      // Remove the server-side injected CSS.
      const jssStyles = document.querySelector('#jss-server-side')
      if (jssStyles && jssStyles.parentNode) {
        jssStyles.parentNode.removeChild(jssStyles)
      }
    }

    render() {
      return (
        <MuiThemeProvider
          theme={this.styleContext.theme}
          sheetsManager={this.styleContext.sheetsManager}
        >
          <div>
            {noHeader ? null : <Header {...this.props} />}
            <AppWrapper>
              <BaseComponent {...this.props} />
            </AppWrapper>
            <Notifier />
          </div>
        </MuiThemeProvider>
      )
    }
  }

  return App
}

export default withLayout
