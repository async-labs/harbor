const prod = process.env.NODE_ENV === 'production'

module.exports = {
  StripePublishableKey: prod
    ? 'pk_XXXXXX'
    : 'pk_XXXXXX'
}
