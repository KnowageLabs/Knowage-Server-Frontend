import * as Blockly from 'blockly'
import i18n from '@/App.i18n'

Blockly.Blocks['agg_field'] = {
    init: function () {
        const fieldDropdown = new Blockly.FieldDropdown([['(select field)', '']])

        fieldDropdown.setValidator(function (newValue) {
            return newValue
        })

        this.appendDummyInput()
            .appendField(
                new Blockly.FieldDropdown([
                    ['SUM', 'SUM'],
                    ['AVG', 'AVG'],
                    ['MIN', 'MIN'],
                    ['MAX', 'MAX'],
                    ['COUNT', 'COUNT'],
                    ['COUNT_DISTINCT', 'COUNT_DISTINCT'],
                    ['TOTAL_SUM', 'TOTAL_SUM'],
                    ['TOTAL_AVG', 'TOTAL_AVG'],
                    ['TOTAL_MIN', 'TOTAL_MIN'],
                    ['TOTAL_MAX', 'TOTAL_MAX'],
                    ['TOTAL_COUNT', 'TOTAL_COUNT']
                ]),
                'AGG'
            )
            .appendField('(')
            .appendField(fieldDropdown, 'FIELD')
            .appendField(')')

        this.setOutput(true, 'Expr')
        this.setPreviousStatement(true, 'sum_expr')
        this.setNextStatement(true, 'sum_expr')
        this.setColour(210)
        this.setTooltip(i18n.global.t('knBlockly.blocks.aggField.tooltip'))
    }
}
