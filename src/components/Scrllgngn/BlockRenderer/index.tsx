import { Component, VNode } from 'preact'
import { BlockContext } from '..'
import HtmlBlockRenderer from './HtmlBlockRenderer'
import ModuleBlockRenderer from './ModuleBlockRenderer'

type Props = {
  type?: 'module' | 'html'
  content?: string|VNode
  context?: BlockContext
  // [WIP] use dynamic-css
  cssLoader?: (url: string) => Promise<void>
}

export default class BlockRenderer extends Component<Props> {
  render() {
    const { props } = this
    const { type, content, context, cssLoader } = props
    switch (type) {
      case 'html':
      case undefined: return <HtmlBlockRenderer content={content} />
      case 'module': return <ModuleBlockRenderer
        url={typeof content === 'string' ? content : ''}
        context={context}
        cssLoader={cssLoader} />
      default: return <></>
    }
  }
}
