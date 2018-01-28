/* eslint-env jest */

import generateSlug from '../../../server/utils/slugify'

describe('slugify', () => {
  it('not duplicated', () => {
    expect.assertions(1)

    const User = {
      findOne() {
        return Promise.resolve(null)
      }
    }

    return generateSlug(User, 'John & Jonhson@#$').then(slug => {
      expect(slug).toBe('john-and-jonhson-')
    })
  })

  it('one time duplicated', () => {
    expect.assertions(1)

    const User = {
      slug: 'john-and-jonhson-',
      findOne({ slug }) {
        if (this.slug === slug) {
          return Promise.resolve({ id: 'id' })
        }

        return Promise.resolve(null)
      }
    }

    return generateSlug(User, 'John & Jonhson@#$').then(slug => {
      expect(slug).toBe('john-and-jonhson--2')
    })
  })

  it('multiple duplicated', () => {
    expect.assertions(1)

    const User = {
      slugs: ['john-and-jonhson-', 'john-and-jonhson--2'],
      findOne({ slug }) {
        if (this.slugs.includes(slug)) {
          return Promise.resolve({ id: 'id' })
        }

        return Promise.resolve(null)
      }
    }

    return generateSlug(User, 'John & Jonhson@#$').then(slug => {
      expect(slug).toBe('john-and-jonhson--3')
    })
  })
})
