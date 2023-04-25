import { Config as PageConfig } from '~/shared-utils/lm-page-config'
import parseTextbase, { Base, valueIsString, valueIsStringArr } from '~/utils/txt-base'
import { SheetBaseEntry, tsvToSheetBase as parseSheetbase } from '~/utils/sheet-base'

const { isArray } = Array

/* * * * * * * * * * * * * * * * * * * *
 * MAKE PAGE DATABASE
 * * * * * * * * * * * * * * * * * * * */
export async function makePageDatabase (dataSources: PageConfig['dataSources'] = []) {
  const dataset = dataSources.map(dataSource => ({
    type: dataSource.type,
    url: dataSource.url,
    data: null as string|null
  }))
  await Promise.all(dataset.map(async dataSource => {
    try {
      const response = await window.fetch(dataSource.url)
      const data = await response.text()
      dataSource.data = data
    } catch (err) {
      // [WIP] silent log error here
      return
    }
  }))
  const pageDatabase = new Base()
  dataset.forEach(dataSource => {
    if (dataSource.data === null) return
    const currentBase = dataSource.type === 'sheet'
      ? parseSheetbase(dataSource.data)
      : parseTextbase(dataSource.data)
    currentBase.collections.forEach(collection => {
      const pageCollection = pageDatabase.create(collection.name)
      collection.entries.forEach(entry => {
        const entryIsSBEntry = entry instanceof SheetBaseEntry
        const entryName = entryIsSBEntry ? entry.id : entry.name
        const pageEntry = pageCollection.create(entryName)
        entry.fields.forEach(field => {
          const pageField = pageEntry.create(field.name)
          pageField.updateRaw(field.raw)
        })
      })
    })
  })
  return pageDatabase
}

/* * * * * * * * * * * * * * * * * * * *
 * FILTER DATABASE
 * * * * * * * * * * * * * * * * * * * */
export function filterPageDatabase (
  db: Base,
  _ids: string|string[]) {
  const ids = isArray(_ids) ? _ids : [_ids]
  db.collections.forEach(collection => {
    collection.entries.forEach(entry => {
      const filter = entry.get('FILTER')
      if (filter === undefined) return
      entry.delete('FILTER')
      const filterValue = filter.value
      if (!valueIsString(filterValue) && !valueIsStringArr(filterValue)) return
      const filters = isArray(filterValue) ? filterValue : [filterValue]
      if (ids.some(id => filters.includes(id))) return
      collection.delete(entry.name)
    })
  })
  return db
}
