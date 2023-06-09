import { render } from 'preact'
import { Options, Renderer } from '~/shared/lm-page-apps'
import Scrllgngn, {
  LayoutName,
  Props,
  PropsBlockData,
  PropsPageData,
  PropsScrollBlockData,
  PropsStickyBlockData,
  TransitionDescriptor,
  TransitionName
} from '~/components/Scrllgngn'
import { toBoolean, toNumber, toString, toVNode } from '~/utils/cast'
import flattenGetters from '~/utils/flatten-getters'
import { Instruction } from '~/components/EventDispatcher'

/* * * * * * * * * * * * * * * * * * *
 * RENDERER
 * * * * * * * * * * * * * * * * * * */
export default function ScrllgngnApp ({
  options,
  root,
  silentLogger
}: Parameters<Renderer>[0]): ReturnType<Renderer> {
  const props = optionsToProps(options)
  const app = <Scrllgngn {...props} /> 
  render(app, root)
  silentLogger?.log(
    'scrllgngn-app/rendered',
    'root:', root,
    '\noptions:', options,
    '\nprops:', props
  )
}

/* * * * * * * * * * * * * * * * * * *
 * OPTIONS TO PROPS
 * * * * * * * * * * * * * * * * * * */
export function optionsToProps (options: Options): Props {
  const props: Props = {}
  const {
    customClass,
    stickyBlocksLazyLoadDistance,
    stickyBlocksViewportHeight,
    stickyBlocksOffsetTop,
    forceStickBlocks,
    thresholdOffset,
    bgColorTransitionDuration,
    pages
  } = options
  // customClass
  if (customClass !== undefined) { props.customClass = toString(customClass) }
  // stickyBlocksLazyLoadDistance
  if (stickyBlocksLazyLoadDistance !== undefined) { props.stickyBlocksLazyLoadDistance = toNumber(stickyBlocksLazyLoadDistance) }
  // stickyBlocksViewportHeight
  if (stickyBlocksViewportHeight !== undefined) { props.stickyBlocksViewportHeight = toString(stickyBlocksViewportHeight) }
  // pages 
  if (forceStickBlocks !== undefined) {
    const strForceStickBlocks = toString(forceStickBlocks)
    if (strForceStickBlocks === 'before'
      || strForceStickBlocks === 'after'
      ||strForceStickBlocks === 'both') {
      props.forceStickBlocks = strForceStickBlocks
    }
  }
  // stickyBlocksOffsetTop
  if (stickyBlocksOffsetTop !== undefined) { props.stickyBlocksOffsetTop = toNumber(stickyBlocksOffsetTop) }
  // thresholdOffset
  if (thresholdOffset !== undefined) { props.thresholdOffset = toString(thresholdOffset) }
  // bgColorTransitionDuration
  if (typeof bgColorTransitionDuration === 'string') { props.bgColorTransitionDuration = bgColorTransitionDuration }
  else if (bgColorTransitionDuration !== undefined) { props.bgColorTransitionDuration = toNumber(bgColorTransitionDuration) }
  // pages
  if (Array.isArray(pages)) { props.pages = arrayToPages(pages) }
  return props
}

/* * * * * * * * * * * * * * * * * * *
 * ARRAY TO PAGES
 * * * * * * * * * * * * * * * * * * */
function arrayToPages (array: unknown[]): PropsPageData[] {
  const extractedPages: PropsPageData[] = []
  array.forEach((pageData: any) => {
    if (typeof pageData === 'object'
      && pageData !== null) {
      const extractedPage: PropsPageData = {}
      const {
        id,
        bgColor,
        blocks,
        dispatchOnEnter,
        dispatchOnLeave
      } = pageData
      // id
      if (id !== undefined) { extractedPage.id = toString(id) }
      // bgColor
      if (bgColor !== undefined) { extractedPage.bgColor = toString(bgColor) }
      // blocks
      if (Array.isArray(blocks)) { extractedPage.blocks = arrayToBlocks(blocks) }
      // dispatchOnEnter // [WIP] should be possible to dispatch multiple events
      if (dispatchOnEnter !== undefined
        && Array.isArray(dispatchOnEnter)) {
        const [instruction, payload] = dispatchOnEnter
        if (Object.values(Instruction).includes(instruction)) {
          extractedPage.dispatchOnEnter = [[instruction, flattenGetters(payload)]]
        }
      }
      // dispatchOnLeave // [WIP] should be possible to dispatch multiple events
      if (dispatchOnLeave !== undefined
        && Array.isArray(dispatchOnLeave)) {
        const [instruction, payload] = dispatchOnLeave
        if (Object.values(Instruction).includes(instruction)) {
          extractedPage.dispatchOnLeave = [[instruction, flattenGetters(payload)]]
        }
      }
      extractedPages.push(extractedPage)
    }
  })
  return extractedPages
}

/* * * * * * * * * * * * * * * * * * *
 * ARRAY TO BLOCKS
 * * * * * * * * * * * * * * * * * * */
function arrayToBlocks (array: unknown[]): PropsBlockData[] {
  const extractedBlocks: PropsBlockData[] = []
  array.forEach((blockData: any) => {
    if (typeof blockData === 'object' && blockData !== null) {
      const {
        id,
        zIndex,
        type,
        content,
        trackScroll,
        depth,
        layout,
        mobileLayout,
        transitions,
        mobileTransitions
      } = blockData
      // depth?: 'scroll'
      if (depth === 'scroll' || depth === undefined) {
        const extractedScrollBlock: PropsScrollBlockData = {}
        extractedScrollBlock.depth = depth
        // id
        if (id !== undefined) { extractedScrollBlock.id = toString(id) }
        // zIndex
        if (zIndex !== undefined) { extractedScrollBlock.zIndex = toNumber(zIndex) }
        // type
        if (type === 'html' || type === 'module') { extractedScrollBlock.type = type }
        // content
        if (content !== undefined) {
          if (type === 'module') { extractedScrollBlock.content = toString(content) }
          else { extractedScrollBlock.content = toVNode(content) }
        }
        // trackScroll
        if (trackScroll !== undefined) { extractedScrollBlock.trackScroll = toBoolean(trackScroll) }
        // layout
        if (layout !== undefined) { extractedScrollBlock.layout = toString(layout) as LayoutName }
        // mobileLayout
        if (mobileLayout !== undefined) { extractedScrollBlock.mobileLayout = toString(mobileLayout) as LayoutName }
        extractedBlocks.push(extractedScrollBlock)
      
      // depth
      } else if (depth === 'front' || depth === 'back') {
        const extractedStickyBlock: PropsStickyBlockData = { depth: 'back' }
        extractedStickyBlock.depth = depth
        // id
        if (id !== undefined) { extractedStickyBlock.id = toString(id) }
        // zIndex
        if (zIndex !== undefined) { extractedStickyBlock.zIndex = toNumber(zIndex) }
        // type
        if (type === 'html' || type === 'module') { extractedStickyBlock.type = type }
        // content
        if (content !== undefined) {
          if (type === 'module') { extractedStickyBlock.content = toString(content) }
          else { extractedStickyBlock.content = toVNode(content) }
        }
        // trackScroll
        if (trackScroll !== undefined) { extractedStickyBlock.trackScroll = toBoolean(trackScroll) }
        // layout
        if (layout !== undefined) { extractedStickyBlock.layout = toString(layout) as LayoutName }
        // mobileLayout
        if (mobileLayout !== undefined) { extractedStickyBlock.mobileLayout = toString(mobileLayout) as LayoutName }
        // transitions // [WIP] should also expect a real array, not just a string input
        if (transitions !== undefined) {
          const transitionsArr: TransitionDescriptor[] = toString(transitions)
            .split(';')
            .filter(e => e !== undefined && e !== '')
            .map(e => e
              .split(',')
              .map(e => e.trim()))
            .map(transitionDescriptor => {
              const name = transitionDescriptor[0] as TransitionName
              const duration = transitionDescriptor[1] ?? ''
              return [name, duration]
            })
            extractedStickyBlock.transitions = transitionsArr
        }
        // mobileTransitions // [WIP] should also expect a real array, not just a string input
        if (mobileTransitions !== undefined) {
          const mobileTransitionsArr: TransitionDescriptor[] = toString(mobileTransitions)
            .split(';')
            .filter(e => e !== undefined && e !== '')
            .map(e => e
              .split(',')
              .map(e => e.trim()))
            .map(transitionDescriptor => {
              const name = transitionDescriptor[0] as TransitionName
              const duration = transitionDescriptor[1] ?? ''
              return [name, duration]
            })
            extractedStickyBlock.mobileTransitions = mobileTransitionsArr
        }
        extractedBlocks.push(extractedStickyBlock)
      }
    }
  })
  return extractedBlocks
}
