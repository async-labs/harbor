require('dotenv').config()
const mongoose = require('mongoose')

const logger = require('./dist/server/log').default
const checkSentEmails = require('./dist/server/gmail/checkSentEmails').default

process.env.NODE_ENV = process.env.NODE_ENV2 || process.env.NODE_ENV

function connectToDB() {
  const dev = process.env.NODE_ENV !== 'production'
  let MONGO_URL = dev ? process.env.MONGO_URL_TEST : process.env.MONGO_URL
  MONGO_URL = process.env.USE_MONGO_TEST2 ? process.env.MONGO_URL_TEST2 : MONGO_URL

  mongoose.Promise = global.Promise
  mongoose.connect(MONGO_URL, { useMongoClient: true })
}

module.exports.checkSentEmailsCron = (event, context, callback) => {
  connectToDB()

  logger.info('checking sent emails')
  checkSentEmails().then(() => {
    mongoose.disconnect()
    logger.info('** checking sent emails: DONE')
    callback(null, { message: 'checking sent emails: Done', event })
  })
}
