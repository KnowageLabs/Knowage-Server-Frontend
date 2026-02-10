import * as Blockly from 'blockly'
import i18n from '@/App.i18n'

Blockly.Blocks['fn_sum'] = {
    init: function () {
        this.appendDummyInput().appendField('SUM').appendField('(')
        this.appendStatementInput('ITEMS').setCheck(['agg_field', 'sum_expr'])
        this.appendDummyInput().appendField(')')
        this.setOutput(true, 'Expr')
        this.setColour(230)
        this.setTooltip(i18n.global.t('knBlockly.blocks.fnSum.tooltip'))
    }
} as any

Blockly.Blocks['fn_avg'] = {
    init: function () {
        this.appendDummyInput().appendField('AVG').appendField('(')
        this.appendStatementInput('ITEMS').setCheck(['agg_field', 'sum_expr'])
        this.appendDummyInput().appendField(')')
        this.setOutput(true, 'Expr')
        this.setColour(230)
        this.setTooltip(i18n.global.t('knBlockly.blocks.fnAvg.tooltip'))
    }
} as any

Blockly.Blocks['fn_min'] = {
    init: function () {
        this.appendDummyInput().appendField('MIN').appendField('(')
        this.appendStatementInput('ITEMS').setCheck(['agg_field', 'sum_expr'])
        this.appendDummyInput().appendField(')')
        this.setOutput(true, 'Expr')
        this.setColour(230)
        this.setTooltip(i18n.global.t('knBlockly.blocks.fnMin.tooltip'))
    }
} as any

Blockly.Blocks['fn_max'] = {
    init: function () {
        this.appendDummyInput().appendField('MAX').appendField('(')
        this.appendStatementInput('ITEMS').setCheck(['agg_field', 'sum_expr'])
        this.appendDummyInput().appendField(')')
        this.setOutput(true, 'Expr')
        this.setColour(230)
        this.setTooltip(i18n.global.t('knBlockly.blocks.fnMax.tooltip'))
    }
} as any
