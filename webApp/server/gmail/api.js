import omit from 'lodash/omit'
import google from 'googleapis'

import accessRevoked, { isAccessRevokedError } from './accessRevoked'

const gmail = google.gmail('v1')
const plus = google.plus('v1')

const OAuth2 = google.auth.OAuth2

export function getAuthClient() {
  return new OAuth2(
    process.env.Google_clientID,
    process.env.Google_clientSecret,
    'https://app.findharbor.com/auth/google/callback'
  )
}

function callApi(method, params) {
  const { appUserId } = params

  return new Promise((resolve, reject) => {
    method(omit(params, ['appUserId']), (err, response) => {
      if (err) {
        if (isAccessRevokedError(err) && appUserId) {
          accessRevoked(appUserId).then(() => reject(err))
        } else {
          reject(err)
        }
      } else {
        resolve(response)
      }
    })
  })
}

export function getProfile(params) {
  return callApi(plus.people.get, params)
}

export function messagesList(params) {
  return callApi(gmail.users.messages.list, params)
}

export function getMessage(params) {
  return callApi(gmail.users.messages.get, params)
}

export function modifyMessage(params) {
  return callApi(gmail.users.messages.modify, params)
}

export function getHistoryList(params) {
  return callApi(gmail.users.history.list, params)
}

export function createLabel(params) {
  return callApi(gmail.users.labels.create, params)
}

export function updateLabel(params) {
  return callApi(gmail.users.labels.patch, params)
}

export function getLabelList(params) {
  return callApi(gmail.users.labels.list, params)
}

export function getLabel(params) {
  return callApi(gmail.users.labels.get, params)
}

export function createFilter(params) {
  return callApi(gmail.users.settings.filters.create, params)
}

export function deleteFilter(params) {
  return callApi(gmail.users.settings.filters.delete, params)
}

export function getFilterList(params) {
  return callApi(gmail.users.settings.filters.list, params)
}
