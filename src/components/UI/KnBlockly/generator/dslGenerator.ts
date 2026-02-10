import * as Blockly from 'blockly'

export const dslGenerator = new Blockly.Generator('DSL')

dslGenerator.ORDER_ATOMIC = 0
dslGenerator.ORDER_MULTIPLICATIVE = 1
dslGenerator.ORDER_ADDITIVE = 2
dslGenerator.ORDER_NONE = 99

function quoteField(name: string) {
    const safe = String(name).replaceAll('"', '\\"')
    return `"${safe}"`
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

dslGenerator.scrub_ = function (_block, code) {
    return code
}
