import Dexie, { Table } from 'dexie'

const DB_NAME = 'knowage-dashboard-cache'
const DB_VERSION = 1
const STORES = { widgetData: '++id, data' }

export interface WidgetData {
    id?: string
    data: object
}

export class SubClassedDexie extends Dexie {
    widgetData!: Table<WidgetData> // Used for type definition
    constructor(dbName: string) {
        super(dbName)
    }
}

export const indexedDB = new SubClassedDexie(DB_NAME)
indexedDB.version(DB_VERSION).stores(STORES)
