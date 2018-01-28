import React from 'react'
import Document, { Head, Main, NextScript } from 'next/document'
import JssProvider from 'react-jss/lib/JssProvider'
import getContext from '../lib/context'

class MyDocument extends Document {
  render() {
    return (
      <html lang="en">
        <Head>
          <link
            href="https://fonts.googleapis.com/css?family=Muli:300,400,600:latin"
            rel="stylesheet"
          />
          <meta charSet="utf-8" />
          {/* Use minimum-scale=1 to enable GPU rasterization */}
          <meta
            name="viewport"
            content={
              'user-scalable=0, initial-scale=1, maximum-scale=1, ' +
              'minimum-scale=1, width=device-width, height=device-height'
            }
          />
          <meta name="google" content="notranslate" />
          <meta httpEquiv="Content-Language" content="en_US" />
          {/* PWA primary color */}
          <meta name="theme-color" content={this.props.stylesContext.theme.palette.primary[900]} />
          <link
            rel="shortcut icon"
            type="image/png"
            href="https://storage.googleapis.com/nice-future-2156/32.png?v1"
          />
          <link rel="stylesheet" type="text/css" href="/static/nprogress.css" />
          <style>
            {`
              a {
                font-weight: 300;
                color: #0D47A1;
                text-decoration: none;
                outline: none
              }
              a:hover, button:hover {
                opacity: 0.75;
                cursor: pointer
              }
              button:focus, ul:focus, a:focus, #wrappingLink:focus {
                outline: none
              }
              img[aria-owns=simple-menu] {
                cursor: pointer
              }
              .textFieldInput, .textFieldLabel {
                  font: 15px Muli !important;
                  font-weight: 300 !important;
                  color: #222 !important;
              }
              .paper {
                padding: 5px 25px;
                min-height: 580px
              }
            `}
          </style>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </html>
    )
  }
}

MyDocument.getInitialProps = ctx => {
  // Get the context to collected side effects.
  const context = getContext()
  const page = ctx.renderPage(Component => props => (
    <JssProvider registry={context.sheetsRegistry} jss={context.jss}>
      <Component {...props} />
    </JssProvider>
  ))

  return {
    ...page,
    stylesContext: context,
    styles: (
      <style
        id="jss-server-side"
        dangerouslySetInnerHTML={{ __html: context.sheetsRegistry.toString() }}
      />
    )
  }
}

export default MyDocument
