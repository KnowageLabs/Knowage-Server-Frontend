import type { ISelectedItems } from './ImportExportTypes'

// export configurations for different types until we get a real bulk service
export const EXPORT_CONFIG = {
    users: {
        endpoint: '/users/export',
        checkboxOptions: [{ key: 'exportPersonalFolder', labelKey: 'importExport.users.includePersonalFolder', defaultValue: true }],
        buildData: (items, fileName, options) => ({
            USERS_LIST: items,
            EXPORT_FILE_NAME: fileName,
            EXPORT_PERSONAL_FOLDER: options.exportPersonalFolder ?? true
        })
    },
    kpis: {
        endpoint: '/kpi/export',
        checkboxOptions: [
            { key: 'targetsAndRelated', labelKey: 'importExport.kpis.targetsAndRelated', defaultValue: true },
            { key: 'scorecardsAndRelated', labelKey: 'importExport.kpis.scorecardsAndRelated', defaultValue: true },
            { key: 'schedulersAndRelated', labelKey: 'importExport.kpis.schedulersAndRelated', defaultValue: true }
        ],
        buildData: (items, fileName, options) => ({
            KPIS_LIST: items.map((kpi) => ({ id: kpi.id, version: kpi.version })),
            EXPORT_FILE_NAME: fileName,
            TARGETS_AND_RELATED_KPIS: options.targetsAndRelated ?? true,
            SCORECARDS_AND_RELATED_KPIS: options.scorecardsAndRelated ?? true,
            SCHEDULERS_AND_RELATED_KPIS: options.schedulersAndRelated ?? true
        })
    },
    analyticalDrivers: {
        endpoint: '/analyticaldrivers/export',
        checkboxOptions: [],
        buildData: (items, fileName) => ({
            DRIVERS_LIST: items.map((driver) => ({ ...driver, catalogType: 'AnalyticalDrivers' })),
            EXPORT_FILE_NAME: fileName
        })
    },
    menu: {
        endpoint: '/menu/export',
        checkboxOptions: [],
        buildData: (items, fileName) => ({
            EXPORT_SELECTED_MENU: items,
            EXPORT_FILE_NAME: fileName
        })
    },
    glossary: {
        endpoint: '/glossary/export',
        checkboxOptions: [],
        buildData: (items, fileName) => ({
            GLOSSARY_LIST: items.map((glossary) => ({
                GLOSSARY_ID: glossary.id,
                GLOSSARY_NM: glossary.name
            })),
            EXPORT_FILE_NAME: fileName
        })
    }
}

// catalog export, just for these 4, and SVG which was removed
export const CATALOG_CONFIG = {
    datasets: { listKey: 'DATASET_LIST', catalogType: 'Dataset' },
    businessModels: { listKey: 'BM_LIST', catalogType: 'BusinessModel' },
    mondrianSchemas: { listKey: 'SCHEMA_LIST', catalogType: 'MondrianSchema' },
    layers: { listKey: 'LAYER_LIST', catalogType: 'Layer' }
}

export const createEmptySelectedItems = (): ISelectedItems => ({
    gallery: [],
    catalogFunction: [],
    users: [],
    kpis: [],
    glossary: [],
    datasets: [],
    businessModels: [],
    mondrianSchemas: [],
    layers: [],
    analyticalDrivers: [],
    menu: [],
    documents: []
})
