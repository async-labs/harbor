export default function getRootURL() {
  const port = process.env.PORT || 8080
  const ROOT_URL =
    process.env.NODE_ENV === 'production'
      ? 'https://app.findharbor.com'
      : `http://localhost:${port}`

  return ROOT_URL
}
