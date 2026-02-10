import * as Blockly from 'blockly'
import i18n from '@/App.i18n'

Blockly.Blocks['variable'] = {
    init: function () {
        // Crea il dropdown con un validator che accetta qualsiasi stringa
        const fieldDropdown = new Blockly.FieldDropdown([['(select variable)', '']])

        // Aggiungi un validator che accetta qualsiasi valore
        fieldDropdown.setValidator(function (newValue) {
            return newValue
        })

        this.appendDummyInput().appendField(i18n.global.t('knBlockly.blocks.variable.label')).appendField(fieldDropdown, 'VAR_NAME')

        this.setOutput(true, 'Expr')
        this.setColour(50)
        this.setTooltip(i18n.global.t('knBlockly.blocks.variable.tooltip'))
    }
}
