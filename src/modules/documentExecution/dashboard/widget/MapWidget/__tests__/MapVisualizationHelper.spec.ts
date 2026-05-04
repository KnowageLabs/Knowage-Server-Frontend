import { describe, expect, it } from 'vitest'
import { getInteractionDataMap, transformDataUsingForeignKeyReturningAggregatedColumns } from '../visualization/MapVisualizationHelper'

describe('MapVisualizationHelper', () => {
    it('merges layer properties with joined target dataset values for interactions', () => {
        const source = {
            properties: {
                NAME_1: 'LOMBARDIA'
            }
        } as any

        const visualization = {
            targetProperty: 'NAME_1'
        } as any

        const mappedData = {
            LOMBARDIA: {
                column_1: 'LOMBARDIA',
                column_2: 7573433
            }
        }

        const targetDatasetData = {
            metaData: {
                fields: [
                    { name: 'REG_NAME', header: 'REG_NAME', dataIndex: 'column_1' },
                    { name: 'ELETTORI', header: 'ELETTORI', dataIndex: 'column_2' }
                ]
            }
        }

        const dataMap = getInteractionDataMap(source, visualization, mappedData, targetDatasetData)

        expect(dataMap.NAME_1).toBe('LOMBARDIA')
        expect(dataMap.REG_NAME).toBe('LOMBARDIA')
        expect(dataMap.ELETTORI).toBe(7573433)
    })

    it('maps dataset row values by field name and header for dataset-only interactions', () => {
        const row = {
            column_1: 'LOMBARDIA',
            column_2: 7573433
        }

        const data = {
            metaData: {
                fields: [
                    { name: 'REG_NAME', header: 'Region', dataIndex: 'column_1' },
                    { name: 'ELETTORI', header: 'Voters', dataIndex: 'column_2' }
                ]
            }
        }

        const dataMap = getInteractionDataMap(row, {} as any, null, null, data)

        expect(dataMap.REG_NAME).toBe('LOMBARDIA')
        expect(dataMap.Region).toBe('LOMBARDIA')
        expect(dataMap.ELETTORI).toBe(7573433)
        expect(dataMap.Voters).toBe(7573433)
    })

    it('merges additional info values into layer interactions when they are not in the plotted dataset payload', () => {
        const source = {
            properties: {
                NAME_1: 'LOMBARDIA'
            }
        } as any

        const visualization = {
            targetProperty: 'NAME_1'
        } as any

        const mappedData = {
            LOMBARDIA: {
                column_1: 'LOMBARDIA',
                column_2: 7573433
            }
        }

        const targetDatasetData = {
            metaData: {
                fields: [
                    { name: 'REG_NAME', header: 'REG_NAME', dataIndex: 'column_1' },
                    { name: 'ELETTORI', header: 'ELETTORI', dataIndex: 'column_2' }
                ]
            }
        }

        const additionalMappedData = {
            LOMBARDIA: {
                PROVINCIA: 'Milano, Bergamo'
            }
        }

        const dataMap = getInteractionDataMap(source, visualization, mappedData, targetDatasetData, null, additionalMappedData)

        expect(dataMap.ELETTORI).toBe(7573433)
        expect(dataMap.PROVINCIA).toBe('Milano, Bergamo')
    })

    it('aggregates extra dataset rows by join key for popup information', () => {
        const infoData = {
            metaData: {
                fields: [
                    { name: 'REG_NAME', header: 'REG_NAME', dataIndex: 'column_1' },
                    { name: 'PROVINCIA', header: 'PROVINCIA', dataIndex: 'column_2' }
                ]
            }
        }

        const aggregatedMap = transformDataUsingForeignKeyReturningAggregatedColumns(
            [
                { column_1: 'LOMBARDIA', column_2: 'Milano' },
                { column_1: 'LOMBARDIA', column_2: 'Bergamo' },
                { column_1: 'LAZIO', column_2: 'Roma' }
            ],
            'column_1',
            infoData
        )

        expect(aggregatedMap.LOMBARDIA.PROVINCIA).toBe('Milano, Bergamo')
        expect(aggregatedMap.LAZIO.PROVINCIA).toBe('Roma')
    })
})
