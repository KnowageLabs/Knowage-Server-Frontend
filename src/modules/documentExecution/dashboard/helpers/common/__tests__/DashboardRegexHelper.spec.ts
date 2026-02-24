import { describe, it, expect, beforeEach } from 'vitest'
import { widgetIdRegex, activeSelectionsRegex, columnRegex, paramsRegex, variablesRegex, calcRegex, repeatIndexRegex, i18nRegex, rowsRegex, aggregationRegex, parameterTextCompatibilityRegex, variableTextCompatibilityRegex, columnFieldRegex, columnTextCompatibilityRegex } from '../DashboardRegexHelper'

// Helper per resettare lastIndex sulle regex globali prima di ogni test
const resetRegex = (regex: RegExp) => {
    regex.lastIndex = 0
    return regex
}

describe('widgetIdRegex', () => {
    it('matcha il placeholder #[kn-widget-id] (include il prefisso #)', () => {
        expect(resetRegex(widgetIdRegex).test('#[kn-widget-id]')).toBe(true)
    })

    it('matcha tutti i placeholder in una stringa', () => {
        resetRegex(widgetIdRegex)
        const matches = 'id1=#[kn-widget-id] id2=#[kn-widget-id]'.matchAll(widgetIdRegex)
        expect([...matches]).toHaveLength(2)
    })

    it('non matcha senza il prefisso #', () => {
        expect(resetRegex(widgetIdRegex).test('[kn-widget-id]')).toBe(false)
    })

    it('non matcha stringhe diverse', () => {
        expect(resetRegex(widgetIdRegex).test('[kn-widget]')).toBe(false)
        expect(resetRegex(widgetIdRegex).test('kn-widget-id')).toBe(false)
    })
})

describe('activeSelectionsRegex', () => {
    it('matcha [kn-active-selection] senza argomento', () => {
        expect(resetRegex(activeSelectionsRegex).test('[kn-active-selection]')).toBe(true)
    })

    it("matcha [kn-active-selection='datasetName']", () => {
        const match = "[kn-active-selection='my-dataset']".match(activeSelectionsRegex)
        expect(match).not.toBeNull()
        expect(match![0]).toContain('my-dataset')
    })

    it('cattura il nome del dataset nel gruppo 1', () => {
        resetRegex(activeSelectionsRegex)
        const result = [..."[kn-active-selection='sales_ds']".matchAll(activeSelectionsRegex)]
        expect(result[0][1]).toBe('sales_ds')
    })

    it('non matcha stringhe non correlate', () => {
        expect(resetRegex(activeSelectionsRegex).test('[kn-selection]')).toBe(false)
    })
})

describe('columnRegex', () => {
    it('matcha una colonna semplice', () => {
        expect(resetRegex(columnRegex).test("[kn-column='columnName']")).toBe(true)
    })

    it('matcha colonna con aggregation', () => {
        expect(resetRegex(columnRegex).test("[kn-column='revenue' aggregation='SUM']")).toBe(true)
    })

    it('matcha colonna con precision', () => {
        expect(resetRegex(columnRegex).test("[kn-column='value' precision='2']")).toBe(true)
    })

    it('matcha colonna con prefix e suffix alfanumerici', () => {
        expect(resetRegex(columnRegex).test("[kn-column='price' prefix='EUR' suffix='EURO']")).toBe(true)
    })

    it('non matcha una colonna con nome non valido (caratteri speciali)', () => {
        expect(resetRegex(columnRegex).test("[kn-column='col@name']")).toBe(false)
    })

    it('cattura correttamente il nome della colonna nel gruppo 1', () => {
        resetRegex(columnRegex)
        const result = [..."[kn-column='revenue']".matchAll(columnRegex)]
        expect(result[0][1]).toBe('revenue')
    })
})

describe('paramsRegex', () => {
    it('matcha un parametro con apici singoli', () => {
        expect(resetRegex(paramsRegex).test("[kn-parameter='myParam']")).toBe(true)
    })

    it('matcha un parametro con virgolette doppie', () => {
        expect(resetRegex(paramsRegex).test('[kn-parameter="myParam"]')).toBe(true)
    })

    it('cattura il nome del parametro nel gruppo 1', () => {
        resetRegex(paramsRegex)
        const result = [..."[kn-parameter='year']".matchAll(paramsRegex)]
        expect(result[0][1]).toBe('year')
    })

    it('non matcha stringa non valida', () => {
        expect(resetRegex(paramsRegex).test("[kn-param='year']")).toBe(false)
    })
})

describe('variablesRegex', () => {
    it('matcha una variabile semplice', () => {
        expect(resetRegex(variablesRegex).test("[kn-variable='myVar']")).toBe(true)
    })

    it('matcha una variabile con key', () => {
        expect(resetRegex(variablesRegex).test("[kn-variable='myVar' key='myKey']")).toBe(true)
    })

    it('cattura nome variabile e key nei gruppi 1 e 2', () => {
        resetRegex(variablesRegex)
        const result = [..."[kn-variable='theme' key='color']".matchAll(variablesRegex)]
        expect(result[0][1]).toBe('theme')
        expect(result[0][2]).toBe('color')
    })

    it('non matcha stringa non valida', () => {
        expect(resetRegex(variablesRegex).test("[kn-var='myVar']")).toBe(false)
    })
})

describe('calcRegex', () => {
    it('matcha un calc semplice', () => {
        expect(resetRegex(calcRegex).test('[kn-calc=(A+B)]')).toBe(true)
    })

    it('matcha calc con min, max e precision', () => {
        expect(resetRegex(calcRegex).test("[kn-calc=(A+B) min='0' max='100' precision='2']")).toBe(true)
    })

    it('non matcha la sintassi con parentesi graffe (usa advancedCalcRegex)', () => {
        expect(resetRegex(calcRegex).test('[kn-calc={A+B}]')).toBe(false)
    })
})

describe('repeatIndexRegex', () => {
    it('matcha [kn-repeat-index]', () => {
        expect(resetRegex(repeatIndexRegex).test('[kn-repeat-index]')).toBe(true)
    })

    it('non matcha varianti errate', () => {
        expect(resetRegex(repeatIndexRegex).test('[kn-repeat]')).toBe(false)
    })
})

describe('i18nRegex', () => {
    it('matcha un token i18n senza punti (il character class non include ".")', () => {
        // Il character class [a-zA-Z0-9_-\s] non include il punto, quindi common.save non matcha
        expect(resetRegex(i18nRegex).test("[kn-i18n='save']")).toBe(true)
        expect(resetRegex(i18nRegex).test("[kn-i18n='common-save']")).toBe(true)
    })

    it('non matcha chiavi con punti (fuori dal character class)', () => {
        expect(resetRegex(i18nRegex).test("[kn-i18n='common.save']")).toBe(false)
    })

    it('cattura la chiave i18n nel gruppo 1', () => {
        resetRegex(i18nRegex)
        const result = [..."[kn-i18n='save']".matchAll(i18nRegex)]
        expect(result[0][1]).toBe('save')
    })

    it('cattura una chiave i18n senza punti', () => {
        resetRegex(i18nRegex)
        const result = [..."[kn-i18n='save']".matchAll(i18nRegex)]
        expect(result[0][1]).toBe('save')
    })
})

describe('parameterTextCompatibilityRegex', () => {
    it('matcha la sintassi legacy $P{paramName}', () => {
        expect(resetRegex(parameterTextCompatibilityRegex).test('$P{year}')).toBe(true)
    })

    it('cattura il nome del parametro nel gruppo 1', () => {
        resetRegex(parameterTextCompatibilityRegex)
        const result = [...'$P{year}'.matchAll(parameterTextCompatibilityRegex)]
        expect(result[0][1]).toBe('year')
    })

    it('non matcha la sintassi moderna', () => {
        expect(resetRegex(parameterTextCompatibilityRegex).test("[kn-parameter='year']")).toBe(false)
    })
})

describe('variableTextCompatibilityRegex', () => {
    it('matcha la sintassi legacy $V{varName}', () => {
        expect(resetRegex(variableTextCompatibilityRegex).test('$V{theme}')).toBe(true)
    })

    it('cattura il nome della variabile nel gruppo 1', () => {
        resetRegex(variableTextCompatibilityRegex)
        const result = [...'$V{theme}'.matchAll(variableTextCompatibilityRegex)]
        expect(result[0][1]).toBe('theme')
    })
})

describe('columnFieldRegex', () => {
    it('matcha la sintassi legacy $F{fieldName}', () => {
        expect(resetRegex(columnFieldRegex).test('$F{revenue}')).toBe(true)
    })

    it('cattura il nome del campo nel gruppo 1', () => {
        resetRegex(columnFieldRegex)
        const result = [...'$F{revenue}'.matchAll(columnFieldRegex)]
        expect(result[0][1]).toBe('revenue')
    })
})

describe('columnTextCompatibilityRegex', () => {
    it('matcha campo semplice $F{name}', () => {
        expect(resetRegex(columnTextCompatibilityRegex).test('$F{name}')).toBe(true)
    })

    it('matcha campo con aggregazione SUM($F{name})', () => {
        expect(resetRegex(columnTextCompatibilityRegex).test('SUM($F{revenue})')).toBe(true)
    })

    it('matcha campo con aggregazione AVG', () => {
        expect(resetRegex(columnTextCompatibilityRegex).test('AVG($F{price})')).toBe(true)
    })
})

describe('rowsRegex', () => {
    it('matcha una colonna con row specificata', () => {
        expect(resetRegex(rowsRegex).test("[kn-column='myCol' row='0']")).toBe(true)
    })

    it('non matcha una colonna senza row', () => {
        expect(resetRegex(rowsRegex).test("[kn-column='myCol']")).toBe(false)
    })
})

describe('aggregationRegex', () => {
    it('matcha una colonna con aggregazione', () => {
        expect(resetRegex(aggregationRegex).test("[kn-column='revenue' aggregation='SUM']")).toBe(true)
    })

    it("cattura il nome della colonna e l'aggregazione", () => {
        const result = "[kn-column='revenue' aggregation='SUM']".match(aggregationRegex)
        expect(result).not.toBeNull()
        expect(result![1]).toBe('revenue')
        expect(result![3]).toBe('SUM')
    })

    it('matcha tutte le aggregazioni supportate', () => {
        const aggregations = ['AVG', 'MIN', 'MAX', 'SUM', 'COUNT', 'COUNT_DISTINCT']
        for (const agg of aggregations) {
            aggregationRegex.lastIndex = 0
            expect(resetRegex(aggregationRegex).test(`[kn-column='col' aggregation='${agg}']`)).toBe(true)
        }
    })
})
