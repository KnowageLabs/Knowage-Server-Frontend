import { describe, expect, it } from 'vitest'
import { getInteractionDataMap } from '../visualization/MapVisualizationHelper'

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
})
