import * as Blockly from 'blockly'
import './blocks/root'
import './blocks/aggField'
import './blocks/fieldRef'
import './blocks/nullif'
import './blocks/functions'
import './blocks/functionCall'
import './blocks/caseWhen'
import './blocks/variable'
import './generator/dslGenerator'

let builtinsPatched = false

function patchBlockType(type: string, patch: (block: Blockly.Block) => void) {
    const def = Blockly.Blocks[type] as { init?: () => void; __kn_patched?: boolean } | undefined
    if (!def?.init || def.__kn_patched) return

    const originalInit = def.init
    def.init = function (this: Blockly.Block) {
        originalInit.call(this)
        patch(this)
    }
    def.__kn_patched = true
}

export function initBlockly() {
    if (builtinsPatched) return
    builtinsPatched = true

    patchBlockType('math_number', (block) => {
        block.setOutput(true, 'Expr')
    })

    patchBlockType('math_arithmetic', (block) => {
        block.getInput('A')?.setCheck('Expr')
        block.getInput('B')?.setCheck('Expr')
        block.setOutput(true, 'Expr')
    })

    patchBlockType('logic_compare', (block) => {
        block.getInput('A')?.setCheck('Expr')
        block.getInput('B')?.setCheck('Expr')
        block.setOutput(true, 'Expr')
    })

    patchBlockType('logic_operation', (block) => {
        block.getInput('A')?.setCheck('Expr')
        block.getInput('B')?.setCheck('Expr')
        block.setOutput(true, 'Expr')
    })

    patchBlockType('logic_negate', (block) => {
        block.getInput('BOOL')?.setCheck('Expr')
        block.setOutput(true, 'Expr')
    })

    patchBlockType('logic_boolean', (block) => {
        block.setOutput(true, 'Expr')
    })

    patchBlockType('text', (block) => {
        block.setOutput(true, 'Expr')
    })
}
