import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { IVariable, IDashboardDriver, ISelection } from '../../Dashboard'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGetExecutionTime = vi.fn(() => null)
const mockGetSelections = vi.fn((): ISelection[] => [])

vi.mock('@/modules/documentExecution/dashboard/Dashboard.store', () => ({
    default: vi.fn(() => ({
        getExecutionTime: mockGetExecutionTime,
        getSelections: mockGetSelections
    }))
}))

vi.mock('@/helpers/commons/localeHelper', () => ({
    getLocale: vi.fn(() => 'en_US'),
    fallbackLocale: 'en',
    getFormattedDateTimeUsingToLocaleString: vi.fn(() => '10:00:00')
}))

vi.mock('../../DataProxyHelper', () => ({
    getVariableData: vi.fn(async () => null)
}))

// ─── Import after mocks ────────────────────────────────────────────────────────
import { getSelectedVariable, setVariableValueFromDriver, setVariablePivotedValues, setVairableLocaleValue, setVariableActiveSelectionValue } from '../VariablesHelper'

// ─── Helper ───────────────────────────────────────────────────────────────────
const makeVariable = (overrides: Partial<IVariable> = {}): IVariable => ({
    name: 'v',
    type: 'static',
    value: '',
    ...overrides
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('getSelectedVariable', () => {
    it('returns null when variables list is null/undefined', () => {
        expect(getSelectedVariable('foo', null as any)).toBeNull()
        expect(getSelectedVariable('foo', undefined as any)).toBeNull()
    })

    it('returns null when no variable matches the name', () => {
        const variables: IVariable[] = [makeVariable({ name: 'alpha' }), makeVariable({ name: 'beta' })]
        expect(getSelectedVariable('gamma', variables)).toBeNull()
    })

    it('returns the first matching variable by name', () => {
        const v1 = makeVariable({ name: 'foo', value: '1' })
        const v2 = makeVariable({ name: 'bar', value: '2' })
        const result = getSelectedVariable('bar', [v1, v2])
        expect(result).toBe(v2)
    })

    it('returns the correct variable when it is the first in the list', () => {
        const v1 = makeVariable({ name: 'target', value: 'hit' })
        const v2 = makeVariable({ name: 'other', value: 'miss' })
        expect(getSelectedVariable('target', [v1, v2])).toBe(v1)
    })
})

describe('setVariableValueFromDriver', () => {
    it('does nothing if variable type is not "driver"', () => {
        const variable = makeVariable({ type: 'static', value: 'original' })
        setVariableValueFromDriver(variable, [])
        expect(variable.value).toBe('original')
    })

    it('sets empty string when driver is not found', () => {
        const variable = makeVariable({ type: 'driver', driver: 'missing', value: 'old' })
        const drivers: IDashboardDriver[] = [{ urlName: 'other', value: 'other-val', name: '', type: '', multivalue: false, driverLabel: '' }]
        setVariableValueFromDriver(variable, drivers)
        expect(variable.value).toBe('')
    })

    it('sets the driver value when the driver is found by urlName', () => {
        const variable = makeVariable({ type: 'driver', driver: 'myDriver', value: '' })
        const drivers: IDashboardDriver[] = [{ urlName: 'myDriver', value: 'driverValue', name: '', type: '', multivalue: false, driverLabel: '' }]
        setVariableValueFromDriver(variable, drivers)
        expect(variable.value).toBe('driverValue')
    })

    it('uses the first matching driver when multiple exist', () => {
        const variable = makeVariable({ type: 'driver', driver: 'sharedName', value: '' })
        const drivers: IDashboardDriver[] = [
            { urlName: 'sharedName', value: 'first', name: '', type: '', multivalue: false, driverLabel: '' },
            { urlName: 'sharedName', value: 'second', name: '', type: '', multivalue: false, driverLabel: '' }
        ]
        setVariableValueFromDriver(variable, drivers)
        expect(variable.value).toBe('first')
    })
})

describe('setVariablePivotedValues', () => {
    it('sets pivoted values from variableData rows', async () => {
        const variable = makeVariable({ type: 'dataset', pivotedValues: {} })
        const variableData = {
            rows: [
                { column_1: 'key1', column_2: 'val1' },
                { column_1: 'key2', column_2: 'val2' }
            ],
            metaData: { fields: [] }
        }
        await setVariablePivotedValues(variable, variableData)
        expect(variable.pivotedValues).toEqual({ key1: 'val1', key2: 'val2' })
    })

    it('handles empty rows producing an empty object', async () => {
        const variable = makeVariable({ type: 'dataset', pivotedValues: { old: 'data' } })
        await setVariablePivotedValues(variable, { rows: [], metaData: { fields: [] } })
        expect(variable.pivotedValues).toEqual({})
    })

    it('overwrites existing pivotedValues', async () => {
        const variable = makeVariable({ type: 'dataset', pivotedValues: { obsolete: 'value' } })
        await setVariablePivotedValues(variable, {
            rows: [{ column_1: 'newKey', column_2: 'newVal' }],
            metaData: { fields: [] }
        })
        expect(variable.pivotedValues).toEqual({ newKey: 'newVal' })
        expect((variable.pivotedValues as any).obsolete).toBeUndefined()
    })
})

describe('setVairableLocaleValue', () => {
    it('sets value and locale from getLocale()', () => {
        const variable = makeVariable({ type: 'profile', value: '' })
        setVairableLocaleValue(variable)
        expect(variable.value).toBe('en_US')
        expect(variable.locale).toBe('en_US')
    })
})

describe('setVariableActiveSelectionValue', () => {
    beforeEach(() => {
        mockGetSelections.mockReset()
        mockGetSelections.mockReturnValue([])
    })

    it('sets value to empty string when activeSelectionColumn is not defined', () => {
        const variable = makeVariable({ value: 'old' })
        setVariableActiveSelectionValue(variable, 'dash1')
        expect(variable.value).toBe('')
    })

    it('sets value to empty string when selections list is empty', () => {
        const variable = makeVariable({ value: 'old', activeSelectionColumn: 'col1', activeSelectionDataset: 99 })
        setVariableActiveSelectionValue(variable, 'dash1')
        expect(variable.value).toBe('')
    })

    it('sets value to empty string when no selection matches dataset+column', () => {
        mockGetSelections.mockReturnValue([{ datasetId: 10, datasetLabel: 'ds', columnName: 'col1', value: ['X'], aggregated: false, timestamp: 0 }])
        const variable = makeVariable({ value: 'old', activeSelectionColumn: 'col1', activeSelectionDataset: 99 })
        setVariableActiveSelectionValue(variable, 'dash1')
        expect(variable.value).toBe('')
    })

    it('joins selection values with ", " when a match is found', () => {
        mockGetSelections.mockReturnValue([{ datasetId: 99, datasetLabel: 'ds', columnName: 'col1', value: ['A', 'B', 'C'], aggregated: false, timestamp: 0 }])
        const variable = makeVariable({ value: '', activeSelectionColumn: 'col1', activeSelectionDataset: 99 })
        setVariableActiveSelectionValue(variable, 'dash1')
        expect(variable.value).toBe('A, B, C')
    })

    it('sets single value without trailing separator', () => {
        mockGetSelections.mockReturnValue([{ datasetId: 5, datasetLabel: 'ds', columnName: 'myCol', value: ['OnlyOne'], aggregated: false, timestamp: 0 }])
        const variable = makeVariable({ value: '', activeSelectionColumn: 'myCol', activeSelectionDataset: 5 })
        setVariableActiveSelectionValue(variable, 'dash1')
        expect(variable.value).toBe('OnlyOne')
    })
})
