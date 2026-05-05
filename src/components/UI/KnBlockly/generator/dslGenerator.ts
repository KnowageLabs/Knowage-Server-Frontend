import * as Blockly from 'blockly'
import { IBlocklyCaseBlockState, IBlocklyFunctionBlockState } from '@/components/UI/KnBlockly/types'

export const dslGenerator = new Blockly.Generator('DSL')

dslGenerator.ORDER_ATOMIC = 0
dslGenerator.ORDER_MULTIPLICATIVE = 1
dslGenerator.ORDER_ADDITIVE = 2
dslGenerator.ORDER_NONE = 99

function quoteField(name: string) {
    const safe = String(name).replaceAll('"', '\\"')
    return `"${safe}"`
}

function quoteString(value: string) {
    const safe = String(value).replaceAll("'", "''")
    return `'${safe}'`
}

function getFunctionState(block: Blockly.Block): IBlocklyFunctionBlockState | null {
    const state = (block as any).saveExtraState?.()
    return state ?? null
}

function getCaseState(block: Blockly.Block): IBlocklyCaseBlockState | null {
    const state = (block as any).saveExtraState?.()
    return state ?? null
}

dslGenerator.forBlock['calc_root'] = function (block) {
    const expr = dslGenerator.valueToCode(block, 'EXPR', dslGenerator.ORDER_NONE) || ''
    return String(expr).trim()
}

dslGenerator.forBlock['agg_field'] = function (block) {
    const agg = block.getFieldValue('AGG')
    const field = block.getFieldValue('FIELD') || ''
    if (!field) return ['/* MISSING_FIELD */', dslGenerator.ORDER_ATOMIC]

    const code = `${agg}(${quoteField(field)})`
    return [code, dslGenerator.ORDER_ATOMIC]
}

dslGenerator.forBlock['field_ref'] = function (block) {
    const field = block.getFieldValue('FIELD') || ''
    if (!field) return ['/* MISSING_FIELD */', dslGenerator.ORDER_ATOMIC]

    return [`$F{${field}}`, dslGenerator.ORDER_ATOMIC]
}

dslGenerator.forBlock['fn_nullif'] = function (block) {
    const a = dslGenerator.valueToCode(block, 'A', dslGenerator.ORDER_NONE) || '0'
    const b = dslGenerator.valueToCode(block, 'B', dslGenerator.ORDER_NONE) || '0'
    const code = `NULLIF(${a},${b})`
    return [code, dslGenerator.ORDER_ATOMIC]
}

dslGenerator.forBlock['variable'] = function (block) {
    const varName = block.getFieldValue('VAR_NAME') || ''
    if (!varName) return ['/* MISSING_VARIABLE */', dslGenerator.ORDER_ATOMIC]
    const code = `$V{${varName}}`
    return [code, dslGenerator.ORDER_ATOMIC]
}

dslGenerator.forBlock['function_call'] = function (block) {
    const state = getFunctionState(block)
    const argCount = state?.argCount ?? 0
    const callName = state?.callName ?? 'function'
    const args: string[] = []

    for (let index = 0; index < argCount; index++) {
        const value = dslGenerator.valueToCode(block, `ARG${index}`, dslGenerator.ORDER_NONE) || '/* MISSING_ARG */'
        args.push(String(value).trim())
    }

    return [`${callName}(${args.join(', ')})`, dslGenerator.ORDER_ATOMIC]
}

dslGenerator.forBlock['case_when'] = function (block) {
    const state = getCaseState(block)
    const pairCount = state?.pairCount ?? 1
    const parts = ['CASE']

    for (let index = 0; index < pairCount; index++) {
        const whenClause = dslGenerator.valueToCode(block, `WHEN${index}`, dslGenerator.ORDER_NONE) || '/* MISSING_CASE_WHEN */'
        const thenClause = dslGenerator.valueToCode(block, `THEN${index}`, dslGenerator.ORDER_NONE) || '/* MISSING_CASE_THEN */'
        parts.push(`WHEN ${String(whenClause).trim()} THEN ${String(thenClause).trim()}`)
    }

    const elseClause = dslGenerator.valueToCode(block, 'ELSE', dslGenerator.ORDER_NONE)
    if (elseClause) {
        parts.push(`ELSE ${String(elseClause).trim()}`)
    }

    parts.push('END')
    return [parts.join(' '), dslGenerator.ORDER_ATOMIC]
}

function createAggregateFunctionGenerator(funcName: string) {
    return function (block: any) {
        const parts: string[] = []
        let itemBlock = block.getInputTargetBlock('ITEMS')

        while (itemBlock) {
            let code = ''
            if (itemBlock.type === 'sum_expr') {
                code = dslGenerator.valueToCode(itemBlock, 'VALUE', dslGenerator.ORDER_NONE) || ''
            } else if (itemBlock.type === 'agg_field') {
                const result = dslGenerator.blockToCode(itemBlock)
                code = Array.isArray(result) ? result[0] : result || ''
            }
            if (code) parts.push(String(code).trim())
            itemBlock = itemBlock.nextConnection ? itemBlock.nextConnection.targetBlock() : null
        }

        const code = `${funcName}(${parts.join(', ')})`
        return [code, dslGenerator.ORDER_ATOMIC]
    }
}

dslGenerator.forBlock['fn_sum'] = createAggregateFunctionGenerator('SUM')
dslGenerator.forBlock['fn_avg'] = createAggregateFunctionGenerator('AVG')
dslGenerator.forBlock['fn_min'] = createAggregateFunctionGenerator('MIN')
dslGenerator.forBlock['fn_max'] = createAggregateFunctionGenerator('MAX')

dslGenerator.forBlock['sum_expr'] = function (block) {
    const value = dslGenerator.valueToCode(block, 'VALUE', dslGenerator.ORDER_NONE) || ''
    return value
}

dslGenerator.forBlock['math_number'] = function (block) {
    const num = block.getFieldValue('NUM')
    return [String(num), dslGenerator.ORDER_ATOMIC]
}

dslGenerator.forBlock['text'] = function (block) {
    return [quoteString(block.getFieldValue('TEXT') || ''), dslGenerator.ORDER_ATOMIC]
}

dslGenerator.forBlock['math_arithmetic'] = function (block) {
    const op = block.getFieldValue('OP')

    const OPS: Record<string, { sym: string; order: number }> = {
        ADD: { sym: '+', order: dslGenerator.ORDER_ADDITIVE },
        MINUS: { sym: '-', order: dslGenerator.ORDER_ADDITIVE },
        MULTIPLY: { sym: '*', order: dslGenerator.ORDER_MULTIPLICATIVE },
        DIVIDE: { sym: '/', order: dslGenerator.ORDER_MULTIPLICATIVE }
    }

    const cfg = OPS[op] ?? OPS.ADD
    const left = dslGenerator.valueToCode(block, 'A', cfg.order) || '0'
    const right = dslGenerator.valueToCode(block, 'B', cfg.order) || '0'

    const code = `${left}${cfg.sym}${right}`
    return [code, cfg.order]
}

dslGenerator.forBlock['logic_compare'] = function (block) {
    const operator = block.getFieldValue('OP')
    const operations: Record<string, string> = {
        EQ: '=',
        GT: '>',
        GTE: '>=',
        LT: '<',
        LTE: '<=',
        NEQ: '<>'
    }

    const left = dslGenerator.valueToCode(block, 'A', dslGenerator.ORDER_NONE) || '/* MISSING_COMPARE_LEFT */'
    const right = dslGenerator.valueToCode(block, 'B', dslGenerator.ORDER_NONE) || '/* MISSING_COMPARE_RIGHT */'
    return [`(${left} ${operations[operator] ?? '='} ${right})`, dslGenerator.ORDER_ATOMIC]
}

dslGenerator.forBlock['logic_operation'] = function (block) {
    const operator = block.getFieldValue('OP') === 'OR' ? 'OR' : 'AND'
    const left = dslGenerator.valueToCode(block, 'A', dslGenerator.ORDER_NONE) || '/* MISSING_LOGIC_LEFT */'
    const right = dslGenerator.valueToCode(block, 'B', dslGenerator.ORDER_NONE) || '/* MISSING_LOGIC_RIGHT */'
    return [`(${left} ${operator} ${right})`, dslGenerator.ORDER_ATOMIC]
}

dslGenerator.forBlock['logic_negate'] = function (block) {
    const value = dslGenerator.valueToCode(block, 'BOOL', dslGenerator.ORDER_NONE) || '/* MISSING_LOGIC_VALUE */'
    return [`NOT (${value})`, dslGenerator.ORDER_ATOMIC]
}

dslGenerator.forBlock['logic_boolean'] = function (block) {
    return [block.getFieldValue('BOOL') === 'TRUE' ? 'TRUE' : 'FALSE', dslGenerator.ORDER_ATOMIC]
}

dslGenerator.scrub_ = function (_block, code) {
    return code
}
