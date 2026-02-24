import { describe, it, expect } from 'vitest'
import { getFormattedWidgetColumns, getFormattedWidgetColumn } from '../WidgetColumnHelper'

const makeColumn = (overrides: Record<string, any> = {}) => ({
    name: 'revenue',
    aliasToShow: 'Revenue',
    alias: 'rev',
    type: 'java.lang.Double',
    fieldType: 'MEASURE',
    multiValue: false,
    aggregationSelected: 'SUM',
    ...overrides
})

describe('getFormattedWidgetColumn', () => {
    it('crea una colonna formattata con i campi base', () => {
        const map: Record<string, string> = {}
        const result = getFormattedWidgetColumn(makeColumn(), map)

        expect(result.columnName).toBe('revenue')
        expect(result.alias).toBe('Revenue')
        expect(result.type).toBe('java.lang.Double')
        expect(result.fieldType).toBe('MEASURE')
        expect(result.multiValue).toBe(false)
        expect(result.filter).toEqual({})
    })

    it('assegna un UUID come id', () => {
        const map: Record<string, string> = {}
        const result = getFormattedWidgetColumn(makeColumn(), map)
        expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    })

    it('usa alias se aliasToShow non è presente', () => {
        const map: Record<string, string> = {}
        const col = makeColumn({ aliasToShow: undefined, alias: 'rev_alias' })
        const result = getFormattedWidgetColumn(col, map)
        expect(result.alias).toBe('rev_alias')
    })

    it('registra la colonna nella columnNameIdMap', () => {
        const map: Record<string, string> = {}
        const result = getFormattedWidgetColumn(makeColumn({ name: 'sales' }), map)
        expect(map['sales']).toBe(result.id)
    })

    it('imposta aggregation se aggregationSelected è presente', () => {
        const map: Record<string, string> = {}
        const result = getFormattedWidgetColumn(makeColumn({ aggregationSelected: 'AVG' }), map)
        expect(result.aggregation).toBe('AVG')
    })

    it('non imposta aggregation se aggregationSelected è assente', () => {
        const map: Record<string, string> = {}
        const result = getFormattedWidgetColumn(makeColumn({ aggregationSelected: undefined }), map)
        expect(result.aggregation).toBeUndefined()
    })

    it('imposta aggregationColumn se aggregationColumn è presente e aggregation non è COUNT', () => {
        const map: Record<string, string> = {}
        const result = getFormattedWidgetColumn(makeColumn({ aggregationSelected: 'SUM', aggregationColumn: 'amount' }), map)
        expect(result.aggregationColumn).toBe('amount')
    })

    it('imposta aggregationColumn a stringa vuota se aggregation è COUNT', () => {
        const map: Record<string, string> = {}
        const result = getFormattedWidgetColumn(makeColumn({ aggregationSelected: 'COUNT', aggregationColumn: 'amount' }), map)
        expect(result.aggregationColumn).toBe('')
    })

    it('aggiunge formula e formulaEditor per colonne calcolate', () => {
        const map: Record<string, string> = {}
        const result = getFormattedWidgetColumn(
            makeColumn({ isCalculated: true, formula: 'A+B', formulaEditor: '<formula>' }),
            map
        )
        expect(result.formula).toBe('A+B')
        expect(result.formulaEditor).toBe('<formula>')
    })

    it('non aggiunge formula per colonne non calcolate', () => {
        const map: Record<string, string> = {}
        const result = getFormattedWidgetColumn(makeColumn({ isCalculated: false }), map)
        expect(result.formula).toBeUndefined()
    })
})

describe('getFormattedWidgetColumns', () => {
    const makeWidget = (columns: any[]) => ({
        content: { columnSelectedOfDataset: columns }
    })

    it('restituisce un array vuoto se il widget non ha content', () => {
        expect(getFormattedWidgetColumns({}, {})).toEqual([])
    })

    it('restituisce un array vuoto se columnSelectedOfDataset è assente', () => {
        expect(getFormattedWidgetColumns({ content: {} }, {})).toEqual([])
    })

    it('formatta tutte le colonne del widget', () => {
        const map: Record<string, string> = {}
        const widget = makeWidget([makeColumn({ name: 'col1' }), makeColumn({ name: 'col2' })])
        const result = getFormattedWidgetColumns(widget, map)
        expect(result).toHaveLength(2)
        expect(result[0].columnName).toBe('col1')
        expect(result[1].columnName).toBe('col2')
    })

    it('permette duplicati per default (allowDuplicates = true)', () => {
        const map: Record<string, string> = {}
        const sameCol = makeColumn({ name: 'revenue', aliasToShow: 'Revenue' })
        const widget = makeWidget([sameCol, sameCol])
        const result = getFormattedWidgetColumns(widget, map)
        expect(result).toHaveLength(2)
    })

    it('elimina duplicati quando allowDuplicates = false', () => {
        const map: Record<string, string> = {}
        const sameCol = makeColumn({ name: 'revenue', aliasToShow: 'Revenue' })
        const widget = makeWidget([sameCol, sameCol])
        const result = getFormattedWidgetColumns(widget, map, false)
        expect(result).toHaveLength(1)
    })

    it('mantiene colonne con stesso nome ma alias diverso con allowDuplicates = false', () => {
        const map: Record<string, string> = {}
        const col1 = makeColumn({ name: 'revenue', aliasToShow: 'Revenue A' })
        const col2 = makeColumn({ name: 'revenue', aliasToShow: 'Revenue B' })
        const widget = makeWidget([col1, col2])
        const result = getFormattedWidgetColumns(widget, map, false)
        expect(result).toHaveLength(2)
    })
})
