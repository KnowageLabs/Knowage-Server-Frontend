import { describe, expect, it } from 'vitest'
import { replaceDriversPlaceholdersByDriverUrlName, replaceVariablesAndDriversPlaceholders, replaceVariablesPlaceholdersByVariableName } from '../InteractionsParserHelper'

describe('replaceVariablesPlaceholdersByVariableName', () => {
    const variables = [
        { name: 'Year', value: '2024', type: 'static' },
        { name: 'DatasetSummary', value: '', type: 'dataset', pivotedValues: { Revenue: '1250', Margin: '14%' } }
    ] as any[]

    it('replaces a plain dashboard variable placeholder', () => {
        expect(replaceVariablesPlaceholdersByVariableName('Sales $V{Year}', variables)).toBe('Sales 2024')
    })

    it('replaces a pivoted dashboard variable placeholder', () => {
        expect(replaceVariablesPlaceholdersByVariableName('Revenue $V{DatasetSummary.Revenue}', variables)).toBe('Revenue 1250')
    })

    it('returns an empty string for unknown variables', () => {
        expect(replaceVariablesPlaceholdersByVariableName('Sales $V{Missing}', variables)).toBe('Sales ')
    })
})

describe('replaceDriversPlaceholdersByDriverUrlName', () => {
    const drivers = [{ name: 'Country', urlName: 'country', value: 'Italy', type: 'STRING', multivalue: false, visible: true, driverLabel: 'COUNTRY' }] as any[]

    it('replaces a driver placeholder using the urlName', () => {
        expect(replaceDriversPlaceholdersByDriverUrlName('Country: $P{country}', drivers)).toBe('Country: Italy')
    })
})

describe('replaceVariablesAndDriversPlaceholders', () => {
    const variables = [{ name: 'Year', value: '2024', type: 'static' }] as any[]
    const drivers = [{ name: 'Country', urlName: 'country', value: 'Italy', type: 'STRING', multivalue: false, visible: true, driverLabel: 'COUNTRY' }] as any[]

    it('resolves mixed static text, variables and document parameters in the same title', () => {
        expect(replaceVariablesAndDriversPlaceholders('Sales $V{Year} - $P{country}', variables, drivers)).toBe('Sales 2024 - Italy')
    })
})
