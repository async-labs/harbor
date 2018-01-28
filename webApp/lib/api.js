import { updateUser } from './withAuth'

const BASE_PATH = '/api/v1'

export const changePrice = price =>
  fetch(`${BASE_PATH}/change-price`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-type': 'application/json; charset=UTF-8'
    },
    body: JSON.stringify({ price })
  })
    .then(res => res.json())
    .then(res => {
      if (res.error) {
        return Promise.reject(new Error(res.error))
      }

      updateUser({ price })

      return Promise.resolve(res)
    })

export const changePageStatus = (isMentorPagePublic, cb) =>
  fetch(`${BASE_PATH}/change-status`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-type': 'application/json; charset=UTF-8'
    },
    body: JSON.stringify({ isMentorPagePublic })
  })
    .then(res => res.json())
    .then(res => {
      if (res.error) {
        if (cb) {
          cb(new Error(res.error))
        }

        return Promise.reject(new Error(res.error))
      }

      updateUser({ isMentorPagePublic })
      if (cb) {
        cb(null, res)
      }

      return Promise.resolve(res)
    })
    .catch(err => {
      if (cb) {
        cb(err)
      }

      return Promise.reject(err)
    })

export const changeDescription = description =>
  fetch(`${BASE_PATH}/change-description`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-type': 'application/json; charset=UTF-8'
    },
    body: JSON.stringify({ description })
  })
    .then(res => res.json())
    .then(res => {
      if (res.error) {
        return Promise.reject(new Error(res.error))
      }

      updateUser({ description })

      return Promise.resolve(res)
    })

export const updateProfile = () =>
  fetch(`${BASE_PATH}/update-profile`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-type': 'application/json; charset=UTF-8'
    }
  })
    .then(res => res.json())
    .then(res => {
      if (res.error) {
        if (res.isGoogleAccessRevokedError) {
          setTimeout(() => {
            document.location = '/login?consent=1'
          }, 1000)

          return Promise.reject(new Error('Re-login is required. Logging out...'))
        }

        return Promise.reject(new Error(res.error))
      }

      updateUser(res)

      return Promise.resolve(res)
    })

export const checkLabelsAndFilters = () =>
  fetch(`${BASE_PATH}/check-labels-and-filters`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-type': 'application/json; charset=UTF-8'
    }
  })
    .then(res => res.json())
    .then(res => {
      if (res.error) {
        if (res.isGoogleAccessRevokedError) {
          setTimeout(() => {
            document.location = '/login?consent=1'
          }, 1000)

          return Promise.reject(new Error('Re-login is required. Logging out...'))
        }

        return Promise.reject(new Error(res.error))
      }

      return Promise.resolve(res)
    })

export const getIncomeReport = () =>
  fetch(`${BASE_PATH}/get-income-report`, {
    credentials: 'include',
    headers: {
      'Content-type': 'application/json; charset=UTF-8'
    }
  })
    .then(res => res.json())
    .then(res => {
      if (res.error) {
        return Promise.reject(new Error(res.error))
      }

      return Promise.resolve(res)
    })

export const getMentorList = () =>
  fetch(`${BASE_PATH}/get-mentor-list`, {
    credentials: 'include',
    headers: {
      'Content-type': 'application/json; charset=UTF-8'
    }
  })
    .then(res => res.json())
    .then(res => {
      if (res.error) {
        return Promise.reject(new Error(res.error))
      }

      return Promise.resolve(res)
    })
