// PATHS
const SCRIPTS_INDEX_URL = process.env.NODE_ENV === 'production' // shared/index.js
  ? new URL('https://assets-decodeurs.lemonde.fr/design-edito/v0.1/shared/index.js')
  : new URL('http://localhost:3000/shared/index.js')
const ROOT_URL = new URL('../', SCRIPTS_INDEX_URL)             // ROOT
const SHARED_URL = new URL('shared/', ROOT_URL)                // shared/
const STYLES_URL = new URL('styles/', SHARED_URL)              // shared/styles/
const STYLES_INDEX_URL = new URL('index.css', STYLES_URL)      // shared/styles/index.css
const STYLES_DEV_URL = new URL('developpment.css', STYLES_URL) // shared/styles/developpment.css
const STYLES_ARTICLE_URL = new URL('article.css', STYLES_URL)  // shared/styles/article.css

export default {
  paths: {
    ROOT_URL,
    SHARED_URL,
    SCRIPTS_INDEX_URL,
    STYLES_URL,
    STYLES_INDEX_URL,
    STYLES_DEV_URL,
    STYLES_ARTICLE_URL
  },
  databaseReservedNames: {
    slots: 'PAGE_SLOTS',
    config: 'PAGE_CONFIG'
  }
}
