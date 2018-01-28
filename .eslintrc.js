module.exports = {
  parser: 'babel-eslint',
  extends: 'airbnb',
  env: {
    browser: true
  },
  plugins: ['react', 'jsx-a11y', 'import'],
  rules: {
    'max-len': ['error', 100],
    semi: ['error', 'never'],
    'comma-dangle': ['error', 'never'],
    'arrow-parens': ['error', 'as-needed'],
    'no-mixed-operators': 'off',
    'no-underscore-dangle': ['error', { allow: ['_id'] }],
    'react/react-in-jsx-scope': 'off',
    'react/jsx-filename-extension': [
      'error',
      {
        extensions: ['.js']
      }
    ]
  }
}
