import * as Blockly from 'blockly'
import i18n from '@/App.i18n'

Blockly.Blocks['calc_root'] = {
    init: function () {
        this.appendValueInput('EXPR').setCheck('Expr').appendField(i18n.global.t('knBlockly.blocks.calcRoot.label'))

        this.setColour(20)
        this.setDeletable(false)
        this.setMovable(true)
        this.setEditable(false)
        this.setTooltip(i18n.global.t('knBlockly.blocks.calcRoot.tooltip'))
    }
}
