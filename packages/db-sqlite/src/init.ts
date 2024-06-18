/* eslint-disable no-param-reassign */
import type { Init, SanitizedCollectionConfig } from 'payload'

import { buildVersionCollectionFields, buildVersionGlobalFields } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { SQLiteAdapter } from './types.js'

import { createTableName } from '../../drizzle/src/createTableName.js'
import { buildTable } from './schema/build.js'

export const init: Init = function init(this: SQLiteAdapter) {
  let locales: [string, ...string[]] | undefined
  if (this.payload.config.localization) {
    locales = this.payload.config.localization.locales.map(({ code }) => code) as [
      string,
      ...string[],
    ]
  }

  this.payload.config.collections.forEach((collection: SanitizedCollectionConfig) => {
    createTableName({
      adapter: this,
      config: collection,
    })

    if (collection.versions) {
      createTableName({
        adapter: this,
        config: collection,
        versions: true,
        versionsCustomName: true,
      })
    }
  })
  this.payload.config.collections.forEach((collection: SanitizedCollectionConfig) => {
    const tableName = this.tableNameMap.get(toSnakeCase(collection.slug))

    buildTable({
      adapter: this,
      disableNotNull: !!collection?.versions?.drafts,
      disableUnique: false,
      fields: collection.fields,
      locales,
      tableName,
      timestamps: collection.timestamps,
      versions: false,
    })

    if (collection.versions) {
      const versionsTableName = this.tableNameMap.get(
        `_${toSnakeCase(collection.slug)}${this.versionsSuffix}`,
      )
      const versionFields = buildVersionCollectionFields(collection)

      buildTable({
        adapter: this,
        disableNotNull: !!collection.versions?.drafts,
        disableUnique: true,
        fields: versionFields,
        locales,
        tableName: versionsTableName,
        timestamps: true,
        versions: true,
      })
    }
  })

  this.payload.config.globals.forEach((global) => {
    const tableName = createTableName({ adapter: this, config: global })

    buildTable({
      adapter: this,
      disableNotNull: !!global?.versions?.drafts,
      disableUnique: false,
      fields: global.fields,
      locales,
      tableName,
      timestamps: false,
      versions: false,
    })

    if (global.versions) {
      const versionsTableName = createTableName({
        adapter: this,
        config: global,
        versions: true,
        versionsCustomName: true,
      })
      const versionFields = buildVersionGlobalFields(global)

      buildTable({
        adapter: this,
        disableNotNull: !!global.versions?.drafts,
        disableUnique: true,
        fields: versionFields,
        locales,
        tableName: versionsTableName,
        timestamps: true,
        versions: true,
      })
    }
  })
}
