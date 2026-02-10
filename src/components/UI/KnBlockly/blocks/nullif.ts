import * as Blockly from 'blockly'
import i18n from '@/App.i18n'

Blockly.Blocks['fn_nullif'] = {
    init: function () {
        this.appendDummyInput().appendField('NULLIF')

        this.appendValueInput('A').setCheck('Expr').appendField('(')

        this.appendValueInput('B').setCheck('Expr').appendField(',')

        this.appendDummyInput().appendField(')')

        this.setInputsInline(true)
        this.setOutput(true, 'Expr')
        this.setColour(290)
        this.setTooltip(i18n.global.t('knBlockly.blocks.fnNullif.tooltip'))
    }
}
