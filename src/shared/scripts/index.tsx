import {
  injectDefaultStyles
} from '../../utils/lm-page-styles'
import {
  getInlineConfigInstructrions,
  getRemoteConfigInstructions,
  applyConfig,
  Instructions
} from '../../utils/lm-page-config'
import {
  makePageDatabase,
  filterPageDatabase
} from '../../utils/lm-page-database'
import {
  getPageSlotsMap
} from '../../utils/lm-page-apps'

// [WIP] silent logs everywhere

/* * * * * * * * * * * * * * * * * * * * * *
 * URLS
 * * * * * * * * * * * * * * * * * * * * * */
export const PAGE_URL = new URL(window.location.href)                 // PAGE
export const ROOT_URL = new URL('../../', import.meta.url)            // ROOT
export const SHARED_URL = new URL('shared/', ROOT_URL)                // shared/
export const ASSETS_URL = new URL('assets/', SHARED_URL)              // assets/
export const FONTS_URL = new URL('fonts/', SHARED_URL)                // fonts/
export const SCRIPTS_URL = new URL('scripts/', SHARED_URL)            // scripts/
export const SCRIPTS_INDEX_URL = new URL(import.meta.url)             // scripts/index.js
export const STYLES_URL = new URL('styles/', SHARED_URL)              // styles/
export const STYLES_INDEX_URL = new URL('index.css', STYLES_URL)      // styles/index.css

/* * * * * * * * * * * * * * * * * * * * * *
 * INIT
 * * * * * * * * * * * * * * * * * * * * * */
const searchParams = new URLSearchParams(SCRIPTS_INDEX_URL.search)
const shouldntInit = searchParams.has('noInit')
if (!shouldntInit) initPage()
export async function initPage () {
  // Load styles (dont await)
  injectDefaultStyles()

  // Read inline config
  const inlineConfigInstructions = getInlineConfigInstructrions()
  const inlinePageConfig = inlineConfigInstructions.toConfig()

  // Load & filter data sources
  const inlineDataSources = inlinePageConfig.dataSources
  const unfilteredPageDatabase = await makePageDatabase(inlineDataSources)
  const pageDatabase = inlinePageConfig.id !== undefined
    ? filterPageDatabase(unfilteredPageDatabase.clone(), inlinePageConfig.id)
    : unfilteredPageDatabase

  // Merge remote configs
  const pageConfigCollection = pageDatabase.get('PAGE_CONFIG')
  const remoteConfigInstructions = getRemoteConfigInstructions(pageConfigCollection)
  const pageConfigInstructions = Instructions.merge(
    inlineConfigInstructions,
    remoteConfigInstructions)
  const pageConfig = pageConfigInstructions.toConfig()

  // Apply config
  applyConfig(pageConfig)

  // Get page slots
  const pageSlotsCollection = pageDatabase.get('PAGE_SLOTS')
  // [WIP] maybe split the getting of the slots first from
  // database then from inline data here rather than everything
  // done inside getPageSlotsMap (see WIP comment above getPageSlotsMap declaration)
  const pageSlotsMap = getPageSlotsMap(pageSlotsCollection)
  
  // Render apps
  pageSlotsMap.forEach(({ name, options }, root) => {
    console.log(root)
    console.log(name)
    console.log(options)
    console.log('-')
  })
}
