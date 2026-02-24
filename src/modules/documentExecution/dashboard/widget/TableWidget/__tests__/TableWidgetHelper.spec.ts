import { describe, it, expect } from 'vitest'
import { getColumnGroup, getWidgetStyleByType, getWidgetStyleByTypeWithoutValidation, stringifyStyleProperties, isConditionMet } from '../TableWidgetHelper'
import type { IWidget, ITableWidgetColumnGroup } from '../../../Dashboard'

// ─── Factory helpers ──────────────────────────────────────────────────────────

const makeWidgetWithGroups = (groups: any[] = [], groupsEnabled = true): Partial<IWidget> =>
    ({
        settings: {
            configuration: {
                columnGroups: {
                    enabled: groupsEnabled,
                    groups
                }
            } as any,
            style: {} as any
        } as any
    }) as any

const makeWidgetWithStyle = (styleType: string, props: any, enabled = true): Partial<IWidget> =>
    ({
        settings: {
            style: {
                [styleType]: {
                    enabled,
                    properties: props
                }
            } as any
        } as any
    }) as any

// ─── getColumnGroup ───────────────────────────────────────────────────────────

describe('getColumnGroup', () => {
    it('restituisce il gruppo se la colonna è inclusa in esso', () => {
        const groups = [{ id: 'grp1', columns: ['col-id-1', 'col-id-2'] }]
        const widget = makeWidgetWithGroups(groups) as IWidget
        const col = { id: 'col-id-1' } as ITableWidgetColumnGroup
        const result = getColumnGroup(widget, col)
        expect(result).toEqual(groups[0])
    })

    it('restituisce undefined se la colonna non è in nessun gruppo (loop senza match)', () => {
        // Nota: la funzione ritorna undefined (implicit) quando groups.enabled=true ma nessun gruppo contiene la colonna
        const groups = [{ id: 'grp1', columns: ['col-id-1'] }]
        const widget = makeWidgetWithGroups(groups) as IWidget
        const col = { id: 'col-id-99' } as ITableWidgetColumnGroup
        expect(getColumnGroup(widget, col)).toBeUndefined()
    })

    it('restituisce false se i gruppi sono disabilitati', () => {
        const groups = [{ id: 'grp1', columns: ['col-id-1'] }]
        const widget = makeWidgetWithGroups(groups, false) as IWidget
        const col = { id: 'col-id-1' } as ITableWidgetColumnGroup
        expect(getColumnGroup(widget, col)).toBe(false)
    })

    it('restituisce false se groups è array vuoto', () => {
        const widget = makeWidgetWithGroups([]) as IWidget
        const col = { id: 'col-id-1' } as ITableWidgetColumnGroup
        expect(getColumnGroup(widget, col)).toBe(false)
    })
})

// ─── getWidgetStyleByType ─────────────────────────────────────────────────────

describe('getWidgetStyleByType', () => {
    it('restituisce una stringa CSS se lo style è abilitato', () => {
        const widget = makeWidgetWithStyle('title', { 'font-size': '16px', color: '#000' }) as IWidget
        const result = getWidgetStyleByType(widget, 'title')
        expect(result).toContain('font-size:16px')
        expect(result).toContain('color:#000')
        expect(result.endsWith(';')).toBe(true)
    })

    it('restituisce stringa vuota se lo style è disabilitato', () => {
        const widget = makeWidgetWithStyle('title', { 'font-size': '16px' }, false) as IWidget
        const result = getWidgetStyleByType(widget, 'title')
        expect(result).toBe('')
    })

    it('restituisce stringa vuota se lo style è undefined', () => {
        const widget = { settings: { style: {} } } as any as IWidget
        const result = getWidgetStyleByType(widget, 'title')
        expect(result).toBe('')
    })

    it('trasforma correttamente la proprietà shadows in box-shadow con color', () => {
        const widget = makeWidgetWithStyle('shadows', {
            'box-shadow': '0px 2px 3px',
            color: 'rgb(204, 204, 204)'
        }) as IWidget
        const result = getWidgetStyleByType(widget, 'shadows')
        expect(result).toContain('box-shadow:')
        expect(result).toContain('rgb(204, 204, 204)')
    })
})

// ─── getWidgetStyleByTypeWithoutValidation ────────────────────────────────────

describe('getWidgetStyleByTypeWithoutValidation', () => {
    it('restituisce stringa CSS indipendentemente da enabled', () => {
        const widget = makeWidgetWithStyle('title', { 'font-size': '14px', color: '#333' }, false) as IWidget
        const result = getWidgetStyleByTypeWithoutValidation(widget, 'title')
        expect(result).toContain('font-size:14px')
        expect(result).toContain('color:#333')
    })

    it('la stringa termina con punto e virgola', () => {
        const widget = makeWidgetWithStyle('borders', { 'border-width': '1px' }) as IWidget
        const result = getWidgetStyleByTypeWithoutValidation(widget, 'borders')
        expect(result.endsWith(';')).toBe(true)
    })
})

// ─── stringifyStyleProperties ─────────────────────────────────────────────────

describe('stringifyStyleProperties', () => {
    it('converte un oggetto di proprietà in stringa CSS', () => {
        const result = stringifyStyleProperties({ color: 'red', 'font-size': '12px' })
        expect(result).toContain('color:red')
        expect(result).toContain('font-size:12px')
        expect(result.endsWith(';')).toBe(true)
    })

    it('restituisce solo ";" per oggetto vuoto', () => {
        const result = stringifyStyleProperties({})
        expect(result).toBe(';')
    })
})

// ─── isConditionMet ───────────────────────────────────────────────────────────

describe('isConditionMet', () => {
    const makeCondition = (operator: string, value: any, type = 'static') => ({ operator, value, type })

    it('operatore == con valori uguali', () => {
        expect(isConditionMet(makeCondition('==', 100), 100)).toBe(true)
        expect(isConditionMet(makeCondition('==', 100), 50)).toBe(false)
    })

    it('operatore != con valori diversi', () => {
        expect(isConditionMet(makeCondition('!=', 100), 50)).toBe(true)
        expect(isConditionMet(makeCondition('!=', 100), 100)).toBe(false)
    })

    it('operatore > maggiore', () => {
        expect(isConditionMet(makeCondition('>', 10), 20)).toBe(true)
        expect(isConditionMet(makeCondition('>', 10), 5)).toBe(false)
        expect(isConditionMet(makeCondition('>', 10), 10)).toBe(false)
    })

    it('operatore < minore', () => {
        expect(isConditionMet(makeCondition('<', 10), 5)).toBe(true)
        expect(isConditionMet(makeCondition('<', 10), 20)).toBe(false)
    })

    it('operatore >= maggiore o uguale', () => {
        expect(isConditionMet(makeCondition('>=', 10), 10)).toBe(true)
        expect(isConditionMet(makeCondition('>=', 10), 11)).toBe(true)
        expect(isConditionMet(makeCondition('>=', 10), 9)).toBe(false)
    })

    it('operatore <= minore o uguale', () => {
        expect(isConditionMet(makeCondition('<=', 10), 10)).toBe(true)
        expect(isConditionMet(makeCondition('<=', 10), 9)).toBe(true)
        expect(isConditionMet(makeCondition('<=', 10), 11)).toBe(false)
    })

    it('operatore IN con valori in lista CSV', () => {
        expect(isConditionMet(makeCondition('IN', 'a, b, c'), 'a')).toBe(true)
        expect(isConditionMet(makeCondition('IN', 'a, b, c'), 'b')).toBe(true)
        expect(isConditionMet(makeCondition('IN', 'a, b, c'), 'd')).toBe(false)
    })

    it('operatore IN con valori in lista tra apici', () => {
        expect(isConditionMet(makeCondition('IN', "'apple', 'banana'"), 'apple')).toBe(true)
        expect(isConditionMet(makeCondition('IN', "'apple', 'banana'"), 'cherry')).toBe(false)
    })

    it('usa il valore della variabile se type è variable', () => {
        const condition = { operator: '==', value: '', type: 'variable', variable: 'myVar' }
        const variables = [{ name: 'myVar', value: 42 }] as any
        expect(isConditionMet(condition, 42, variables)).toBe(true)
        expect(isConditionMet(condition, 99, variables)).toBe(false)
    })

    it('usa il valore del driver se type è parameter', () => {
        const condition = { operator: '==', value: '', type: 'parameter', parameter: 'myParam' }
        const drivers = [{ name: 'myParam', value: 'active' }] as any
        expect(isConditionMet(condition, 'active', undefined, drivers)).toBe(true)
        expect(isConditionMet(condition, 'inactive', undefined, drivers)).toBe(false)
    })
})
