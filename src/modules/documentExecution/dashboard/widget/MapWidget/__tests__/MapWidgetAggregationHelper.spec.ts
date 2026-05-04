import { describe, expect, it } from 'vitest'
import { getMapCategoryColumnsForService } from '../MapWidgetAggregationHelper'

describe('MapWidgetAggregationHelper', () => {
    it('keeps only aggregate-by categories plus the join column for join datasets', () => {
        const widget = {
            settings: {
                visualizations: [
                    {
                        target: 'l_regions',
                        targetDataset: 'ds_votes',
                        targetDatasetForeignKeyColumn: 'REG_NAME'
                    }
                ]
            }
        } as any

        const datasetLayer = {
            layerId: 'ds_votes',
            columns: [
                { name: 'REG_NAME', alias: 'REG_NAME', fieldType: 'ATTRIBUTE', deleted: false, properties: { aggregateBy: false } },
                { name: 'PROVINCIA', alias: 'PROVINCIA', fieldType: 'ATTRIBUTE', deleted: false, properties: { aggregateBy: false } },
                { name: 'COMUNE', alias: 'COMUNE', fieldType: 'ATTRIBUTE', deleted: false, properties: { aggregateBy: false } },
                { name: 'SEZIONE', alias: 'SEZIONE', fieldType: 'ATTRIBUTE', deleted: false, properties: { aggregateBy: false } },
                { name: 'COORD', alias: 'COORD', fieldType: 'SPATIAL_ATTRIBUTE', deleted: false, properties: { aggregateBy: false } },
                { name: 'ELETTORI', alias: 'ELETTORI', fieldType: 'MEASURE', deleted: false, properties: { aggregateBy: false } }
            ]
        } as any

        const categories = getMapCategoryColumnsForService(widget, datasetLayer)

        expect(categories.map((column: any) => column.name)).toEqual(['REG_NAME'])
    })

    it('preserves the spatial attribute when the dataset layer is used directly on the map', () => {
        const widget = {
            settings: {
                visualizations: [
                    {
                        target: 'ds_points'
                    }
                ]
            }
        } as any

        const datasetLayer = {
            layerId: 'ds_points',
            columns: [
                { name: 'REG_NAME', alias: 'REG_NAME', fieldType: 'ATTRIBUTE', deleted: false, properties: { aggregateBy: false } },
                { name: 'GEO', alias: 'GEO', fieldType: 'SPATIAL_ATTRIBUTE', deleted: false, properties: { aggregateBy: false } },
                { name: 'VALUE', alias: 'VALUE', fieldType: 'MEASURE', deleted: false, properties: { aggregateBy: false } }
            ]
        } as any

        const categories = getMapCategoryColumnsForService(widget, datasetLayer)

        expect(categories.map((column: any) => column.name)).toEqual(['GEO'])
    })
})
