import * as Blockly from 'blockly'
import i18n from '@/App.i18n'

Blockly.Blocks['field_ref'] = {
    init: function () {
        const fieldDropdown = new Blockly.FieldDropdown([['(select field)', '']])

        fieldDropdown.setValidator(function (newValue) {
            return newValue
        })

        this.appendDummyInput().appendField(fieldDropdown, 'FIELD')

        this.setOutput(true, 'Expr')
        this.setColour(210)
        this.setTooltip(i18n.global.t('knBlockly.blocks.aggField.tooltip'))
    }
}
