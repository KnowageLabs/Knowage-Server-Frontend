import * as Blockly from 'blockly'

Blockly.Blocks['text_single_quote'] = {
    init: function () {
        this.appendDummyInput().appendField("'").appendField(new Blockly.FieldTextInput(''), 'TEXT').appendField("'")

        this.setOutput(true, 'Expr')
        this.setColour(160)
    }
}
