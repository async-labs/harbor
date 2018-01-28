import sm from 'sitemap'
import User from './models/User'

const sitemap = sm.createSitemap({
  hostname: 'https://app.findharbor.com',
  cacheTime: 600000 // 600 sec - cache purge period
})

export default function setup({ server }) {
  User.find({ isStripeConnected: true, isMentorPagePublic: true }, 'slug').then(users => {
    users.forEach(user => {
      sitemap.add({ url: `/contact/${user.slug}`, changefreq: 'weekly', priority: 0.9 })
    })
  })

  server.get('/sitemap.xml', (req, res) => {
    sitemap.toXML((err, xml) => {
      if (err) {
        res.status(500).end()
        return
      }

      res.header('Content-Type', 'application/xml')
      res.send(xml)
    })
  })

  server.get('/robots.txt', (req, res) => {
    res.header('Content-Type', 'text/plain;charset=UTF-8')
    res.end(
      'User-agent: *\nDisallow: /auth/google\nDisallow: /contact$\nSitemap: https://app.findharbor.com/sitemap.xml'
    )
  })
}
