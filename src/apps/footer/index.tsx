import { render } from 'preact'
import { Options, Renderer } from '~/shared/lm-page-apps'
import { optionsToProps as optionsToThumbnailProps } from '~/apps/thumbnail'
import { Props as ThumbnailProps } from '~/components/Thumbnail'
import Footer, { Props } from '~/components/Footer'
import { toNumber, toString, toVNode } from '~/utils/cast'

/* * * * * * * * * * * * * * * * * * *
 * RENDERER
 * * * * * * * * * * * * * * * * * * */
export default function FooterApp({
  options,
  root,
  silentLogger
}: Parameters<Renderer>[0]): ReturnType<Renderer> {
  const props = optionsToProps(options)
  const app = <Footer {...props} />
  render(app, root)
  silentLogger?.log(
    'footer-app/rendered',
    'root:', root,
    '\noptions:', options,
    '\nprops:', props
  )
}

/* * * * * * * * * * * * * * * * * * *
 * OPTIONS TO PROPS
 * * * * * * * * * * * * * * * * * * */
export function optionsToProps(options: Options): Props {
  const {
    customClass, //?: string
    bgColor, //?: string
    bgImageUrl, //?: string
    bgImageAlt, //?: string
    textAbove, //?: string|VNode
    textBelow, //?: string|VNode
    thumbnailsData, //?: ThumbnailProps[]
    visibilityThreshold, //?: number
    // onVisible, // cannot use functions from options yet //?: (ioEntry: IntersectionObserverEntry) => void
    // onHidden // cannot use functions from options yet //?: (ioEntry: IntersectionObserverEntry) => void
  } = options

  const props: Props = {}
  if (customClass !== undefined) props.customClass = toString(customClass)
  if (bgColor !== undefined) props.bgColor = toString(bgColor)
  if (bgImageUrl !== undefined) props.bgImageUrl = toString(bgImageUrl)
  if (bgImageAlt !== undefined) props.bgImageAlt = toString(bgImageAlt)
  if (textAbove !== undefined) { props.textAbove = toVNode(textAbove) }
  if (textBelow !== undefined) { props.textBelow = toVNode(textBelow) }
  if (Array.isArray(thumbnailsData)) {
    const propsThumbnailsData: ThumbnailProps[] = [];
    (thumbnailsData as unknown[]).forEach(thumbnailData => {
      try {
        Object.keys(thumbnailData as Options) // this to check if object
        const thumbnailDataAsProps = optionsToThumbnailProps(thumbnailData as Options)
        propsThumbnailsData.push(thumbnailDataAsProps)
      } catch (err) {}
    })
    if (propsThumbnailsData.length > 0) {
      props.thumbnailsData = propsThumbnailsData
    }
  }
  if (visibilityThreshold !== undefined) {
    props.visibilityThreshold = toNumber(visibilityThreshold)
  }

  return props
}
