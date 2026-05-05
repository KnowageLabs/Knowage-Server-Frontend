import { describe, expect, it } from 'vitest'
import { buildToolbox } from '@/components/UI/KnBlockly/toolbox/buildToolbox'

describe('buildToolbox', () => {
    it('creates a QBE toolbox with parsed function metadata', () => {
        const toolbox = buildToolbox(
            'qbe',
            [
                { category: 'AGGREGATION', formula: 'sum(expr1, expr2, …, exprN)', label: 'SUM', name: 'SUM' },
                { category: 'String', formula: 'substring(str, pos[, len])', label: 'substring', name: 'substring' },
                { category: 'SQL', formula: 'CASE WHEN expr1 THEN expr2 [WHEN expr3 THEN expr4]* [ELSE expr5] END', label: 'case', name: 'case' },
                { category: 'TIME', formula: 'current_date()', label: 'CURRENT_DATE', name: 'CURRENT_DATE' }
            ],
            false
        )

        expect(toolbox.contents[0]).toMatchObject({ kind: 'category', name: 'Fields' })

        const aggregationCategory = toolbox.contents.find((category: any) => category.name === 'AGGREGATION')
        expect(aggregationCategory.contents[0]).toMatchObject({
            type: 'function_call',
            extraState: {
                argCount: 1,
                callName: 'sum',
                maxArgs: 1,
                minArgs: 1,
                supportsVariableArgs: false
            }
        })

        const stringCategory = toolbox.contents.find((category: any) => category.name === 'String')
        expect(stringCategory.contents[0]).toMatchObject({
            type: 'function_call',
            extraState: {
                argCount: 2,
                argLabels: ['str', 'pos', 'len'],
                callName: 'substring',
                maxArgs: 3,
                minArgs: 2,
                supportsVariableArgs: true
            }
        })

        const sqlCategory = toolbox.contents.find((category: any) => category.name === 'SQL')
        expect(sqlCategory.contents[0]).toMatchObject({
            type: 'case_when',
            extraState: {
                displayName: 'case',
                pairCount: 1
            }
        })

        const timeCategory = toolbox.contents.find((category: any) => category.name === 'TIME')
        expect(timeCategory.contents[0]).toMatchObject({
            type: 'function_call',
            extraState: {
                argCount: 0,
                callName: 'current_date',
                maxArgs: 0,
                minArgs: 0,
                supportsVariableArgs: false
            }
        })
    })

    it('keeps dashboard toolbox categories aligned with variable availability', () => {
        const toolboxWithoutVariables = buildToolbox('dashboard', [], false)
        const toolboxWithVariables = buildToolbox('dashboard', [], true)

        expect(toolboxWithoutVariables.contents.some((category: any) => category.name === 'Variables')).toBe(false)
        expect(toolboxWithVariables.contents.some((category: any) => category.name === 'Variables')).toBe(true)
    })
})
