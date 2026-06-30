import { describe, expect, it } from 'vitest'
import { getDashboardParameterPlaceholder, getDashboardParameterPlaceholderOptions, getDashboardVariablePlaceholder, getDashboardVariablePlaceholderOptions } from '../DashboardPlaceholderHelper'

describe('getDashboardParameterPlaceholder', () => {
    it('formats a dashboard parameter placeholder using the driver url name', () => {
        expect(getDashboardParameterPlaceholder('country')).toBe('$P{country}')
    })
})

describe('getDashboardVariablePlaceholder', () => {
    it('formats a simple dashboard variable placeholder', () => {
        expect(getDashboardVariablePlaceholder('Year')).toBe('$V{Year}')
    })

    it('formats a pivoted dashboard variable placeholder', () => {
        expect(getDashboardVariablePlaceholder('DatasetSummary', 'Revenue')).toBe('$V{DatasetSummary.Revenue}')
    })
})

describe('getDashboardParameterPlaceholderOptions', () => {
    it('returns unique parameter placeholders for the available dashboard drivers', () => {
        const drivers = [
            { driverLabel: 'Country', name: 'Country', urlName: 'country' },
            { driverLabel: 'Country Duplicate', name: 'Country Duplicate', urlName: 'country' }
        ] as any[]

        expect(getDashboardParameterPlaceholderOptions(drivers)).toEqual([{ label: 'Country', placeholder: '$P{country}' }])
    })
})

describe('getDashboardVariablePlaceholderOptions', () => {
    it('returns placeholders for static, column-based and pivoted dashboard variables', () => {
        const variables = [
            { name: 'Year', value: '2024', type: 'static' },
            { name: 'StoreRevenue', value: '1250', type: 'dataset', column: 'REVENUE' },
            { name: 'DatasetSummary', value: '', type: 'dataset', pivotedValues: { Revenue: '1250', Margin: '14%' } },
            { name: 'EmptyDatasetVariable', value: '', type: 'dataset', pivotedValues: {} }
        ] as any[]

        expect(getDashboardVariablePlaceholderOptions(variables)).toEqual([
            { label: 'Year', placeholder: '$V{Year}' },
            { label: 'StoreRevenue', placeholder: '$V{StoreRevenue}' },
            { label: 'DatasetSummary.Revenue', placeholder: '$V{DatasetSummary.Revenue}' },
            { label: 'DatasetSummary.Margin', placeholder: '$V{DatasetSummary.Margin}' }
        ])
    })
})
