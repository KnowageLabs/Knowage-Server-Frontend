import { describe, expect, it } from 'vitest'
import { buildCalculatedField, normalizeCalculatedFieldForAPI, updateCalculatedField } from '@/helpers/commons/buildQbeCalculatedField'

describe('buildQbeCalculatedField', () => {
    it('persists editor state for new calculated fields', () => {
        const blocklyState = { dsl: 'SUM($F{Sales})', mode: 'text' }
        const calculatedField = buildCalculatedField(
            {
                alias: 'Revenue',
                blocklyXml: blocklyState,
                expression: 'SUM($F{Sales})',
                formulaEditor: 'SUM($F{Sales})',
                nature: 'MEASURE',
                type: 'NUMBER'
            },
            [{ alias: 'Sales', id: 'store.sales' }]
        )

        expect(calculatedField.alias).toBe('Revenue')
        expect(calculatedField.blocklyXml).toEqual(blocklyState)
        expect(calculatedField.blocklyXml).not.toBe(blocklyState)
        expect(calculatedField.formulaEditor).toBe('SUM($F{Sales})')
        expect(calculatedField.formula).toBe('SUM(store.sales)')
    })

    it('updates editor state while preserving legacy field metadata', () => {
        const updatedField = updateCalculatedField(
            {
                funct: 'SUM',
                iconCls: 'icon',
                inUse: true,
                order: 'ASC',
                uniqueID: 'field-id',
                visible: true
            },
            {
                alias: 'Revenue',
                blocklyXml: { blocklyXml: { blocks: { blocks: [] } }, mode: 'blockly' },
                expression: '$F{Sales}',
                formulaEditor: '$F{Sales}',
                nature: 'ATTRIBUTE',
                type: 'STRING'
            },
            [{ alias: 'Sales', id: 'store.sales' }]
        )

        expect(updatedField.uniqueID).toBe('field-id')
        expect(updatedField.iconCls).toBe('icon')
        expect(updatedField.blocklyXml).toEqual({ blocklyXml: { blocks: { blocks: [] } }, mode: 'blockly' })
        expect(updatedField.formulaEditor).toBe('$F{Sales}')
        expect(updatedField.expression).toBe('$F{Sales}')
        expect(updatedField.formula).toBe('store.sales')
    })

    it('converts field placeholders containing underscores to backend ids', () => {
        const formula = 'sum($F{customer_region_id}, $F{customer_region_id})'
        const calculatedField = buildCalculatedField(
            {
                alias: 'djas',
                expression: formula,
                formulaEditor: formula,
                nature: 'MEASURE',
                type: 'NUMBER'
            },
            [{ alias: 'customer_region_id', id: 'customers:customer_region_id' }]
        )

        expect(calculatedField.id.expression).toBe('sum(customers:customer_region_id, customers:customer_region_id)')
        expect(calculatedField.expression).toBe(formula)
        expect(calculatedField.formula).toBe('sum(customers:customer_region_id, customers:customer_region_id)')
        expect(calculatedField.formulaEditor).toBe(formula)
    })

    it('normalizes existing calculated fields before qbe api calls', () => {
        const formula = 'sum($F{customer_region_id}, $F{customer_region_id})'
        const normalizedField = normalizeCalculatedFieldForAPI(
            {
                type: 'inline.calculated.field',
                formula: formula,
                formulaEditor: formula,
                expression: formula,
                id: {
                    expression: formula,
                    expressionSimple: formula
                }
            },
            [{ alias: 'customer_region_id', id: 'customers:customer_region_id' }]
        )

        expect(normalizedField.id.expression).toBe('sum(customers:customer_region_id, customers:customer_region_id)')
        expect(normalizedField.id.expressionSimple).toBe(formula)
        expect(normalizedField.formula).toBe('sum(customers:customer_region_id, customers:customer_region_id)')
        expect(normalizedField.formulaEditor).toBe(formula)
    })
})
