import { Config } from '~/shared-utils/lm-page-config'
import Logger from '~/utils/silent-log'
import strToNodes from '~/utils/str-to-nodes'
import { Collection } from '~/utils/txt-base'

/* * * * * * * * * * * * * * * * * * *
 * Names
 * * * * * * * * * * * * * * * * * * */
export enum Names {
  SCRLLGNGN = 'scrllgngn'
}

export const validNames = Object.values(Names)
export function isValidName (name: string): name is Names {
  if (validNames.includes(name as Names)) return true
  return false
}

/* * * * * * * * * * * * * * * * * * *
 * Options
 * * * * * * * * * * * * * * * * * * */
export type Options = Record<string, unknown>

export function isValidOptions (obj: unknown): obj is Options  {
  // [WIP] Dont know if we can do better, this basically
  // just checks if we can call Object.keys on it
  try {
    Object.keys(obj as any)
    return true
  } catch (err) {
    return false
  }
}

export function mergeOptions (...optionsList: Options[]) {
  return optionsList.reduce((prev, curr) => ({
    ...prev,
    ...curr
  }), {} as Options)
}

export type InlineOption = string
  |number
  |boolean
  |null
  |HTMLElement
  |InlineOption[]
  |{ [key: string]: InlineOption }

export function readOptionsNode (propsNode: HTMLElement): InlineOption {
  const nodeDataType = propsNode.getAttribute('type')
  const children = [...propsNode.querySelectorAll(':scope > *')]
    .filter((e): e is HTMLElement => e instanceof HTMLElement)
  const unnamedChildren: HTMLElement[] = []
  const namedChildren: HTMLElement[] = []
  children.forEach(child => {
    const value = child.getAttribute('value')
    if (value === null || value.length === 0) unnamedChildren.push(child)
    else namedChildren.push(child)
  })
  // No data children OR dataType is html => return the value of innerHTML
  if (children.length === 0 || nodeDataType === 'html') {
    const rawNodeVal = propsNode.innerHTML.trim()
    if (nodeDataType === 'number') return parseFloat(rawNodeVal)
    if (nodeDataType === 'boolean') return !rawNodeVal.trim().match(/^false$/i)
    if (nodeDataType === 'null') return null
    if (nodeDataType === 'html') {
      const asNodes = strToNodes(rawNodeVal)
      const asHtml = asNodes
        .filter((e): e is HTMLElement => e instanceof HTMLElement)
      return asHtml
    }
    else return rawNodeVal
  }
  // With only unnamed data children
  if (namedChildren.length === 0) return unnamedChildren
    .map(child => readOptionsNode(child))
  // With named data children
  // [WIP] add unnamed to the result?
  const returned: InlineOption = {}
  children.forEach(child => {
    const title = child.getAttribute('value')
    if (typeof title !== 'string' || title.length < 1) return
    returned[title] = readOptionsNode(child)
  })
  return returned
}

/* * * * * * * * * * * * * * * * * * *
 * Slots
 * * * * * * * * * * * * * * * * * * */
export type Slots = Map<HTMLElement, {
  name: Names,
  options: Options
}>

// [WIP] Pretty sure this could be facrorized and sliced into
// smaller individual (exported?) functions

// [WIP] include filtered slots somewhere in order for ../../index.tsx to silent log ?
export function getPageSlotsMap (pageSlotsCollection?: Collection) {
  const pageSlotsMap: Slots = new Map()
  // Get slots from page database
  pageSlotsCollection?.entries.forEach(pageSlotEntry => {
    const slotName = pageSlotEntry.get('name')?.value
    const slotSelector = pageSlotEntry.get('selector')?.value
    const slotOptions = flattenGetters(pageSlotEntry.get('options')?.value)
    if (typeof slotName !== 'string') return
    if (typeof slotSelector !== 'string') return
    if (!isValidName(slotName)) return
    const roots: HTMLElement[] = [...document.querySelectorAll(slotSelector)]
      .filter((e): e is HTMLElement => e instanceof HTMLElement)
    roots.forEach(root => {
      const fromMap = pageSlotsMap.get(root)
      if (fromMap === undefined) return pageSlotsMap.set(root, {
        name: slotName,
        options: slotOptions ?? {}
      })
      pageSlotsMap.set(root, {
        name: slotName,
        options: mergeOptions(
          fromMap.options,
          slotOptions
        )
      })
    })
  })

  // Get slots from inline page markup
  const pageInlineAppConfigs = [...document.querySelectorAll('.lm-app-config')]
    .filter((e): e is HTMLElement => e instanceof HTMLElement)
  pageInlineAppConfigs.forEach(inlineAppConfig => {
    const slotName = inlineAppConfig.getAttribute('value')
    if (typeof slotName !== 'string') return
    const root = inlineAppConfig.parentElement
    if (root === null) return
    if (!isValidName(slotName)) return
    const slotOptions = readOptionsNode(inlineAppConfig)
    if (typeof slotOptions !== 'object') return
    if (slotOptions === null) return
    if (!isValidOptions(slotOptions)) return
    const fromMap = pageSlotsMap.get(root)
    if (fromMap === undefined) return pageSlotsMap.set(root, {
      name: slotName,
      options: slotOptions
    })
    pageSlotsMap.set(root, {
      name: slotName,
      options: mergeOptions(
        fromMap.options,
        slotOptions
      )
    })
  })
  return pageSlotsMap
}

/* * * * * * * * * * * * * * * * * * *
 * Render
 * * * * * * * * * * * * * * * * * * */
type RenderOptions = {
  name: Names,
  options: Options,
  root: HTMLElement,
  pageConfig?: Config
  silentLogger?: Logger
}

export type Renderer = (appOptions: Omit<RenderOptions, 'name'>) => void

export async function renderApp ({ name, options, root, pageConfig, silentLogger }: RenderOptions) {
  // Load renderer
  let renderer: Renderer|null = null
  if (name === Names.SCRLLGNGN) { renderer = (await import('../../../../apps/scrllgngn')).default }
  if (renderer === null) throw new Error(`Could not find a renderer for an app named ${name}`)

  // Add lm-app-root class on the root
  root.classList.add('lm-app-root')

  // Select target inside root for rendering
  const prerenderedContent = root.querySelector('.lm-app-prerender')
  const hasPrerenderedContent = prerenderedContent instanceof HTMLElement
  let target: HTMLElement
  if (hasPrerenderedContent) {
    target = prerenderedContent
    target.classList.remove('lm-app-prerender')
  } else {
    target = document.createElement('div')
    root.appendChild(target)
  }
  target.classList.add('lm-app')

  // Perform the actual rendering
  const rendered = renderer({
    root: target,
    options,
    pageConfig,
    silentLogger
  })

  return rendered
}

/* * * * * * * * * * * * * * * * * * *
 * Utility
 * * * * * * * * * * * * * * * * * * */
// [WIP] either rename or make it's own external util?
export function flattenGetters (obj: unknown): Record<string, unknown> {
  try {
    const { entries, getOwnPropertyDescriptors } = Object
    const getters = entries(getOwnPropertyDescriptors(obj))
      .filter(([_, desc]) => (typeof desc.get === 'function'))
      .map(([key]) => key)
    const returned: Record<string, unknown> = {}
    getters.forEach(getter => {
      returned[getter] = (obj as any)[getter]
    })
    return returned
  } catch (err) {
    return {}
  }
}