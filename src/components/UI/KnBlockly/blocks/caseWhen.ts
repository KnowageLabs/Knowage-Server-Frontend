import * as Blockly from 'blockly'
import i18n from '@/App.i18n'
import { IBlocklyCaseBlockState } from '@/components/UI/KnBlockly/types'

type CaseWhenBlock = Blockly.Block & {
    customContextMenu?: (options: any[]) => void
    knCaseState?: IBlocklyCaseBlockState
    loadExtraState?: (state: IBlocklyCaseBlockState) => void
    saveExtraState?: () => IBlocklyCaseBlockState
}

const defaultState: IBlocklyCaseBlockState = {
    displayName: 'CASE',
    formula: 'CASE WHEN expr1 THEN expr2 [WHEN expr3 THEN expr4]* [ELSE expr5] END',
    pairCount: 1
}

function getState(block: CaseWhenBlock): IBlocklyCaseBlockState {
    return block.knCaseState ?? defaultState
}

function updateShape(block: CaseWhenBlock) {
    const state = getState(block)
    const connectedBlocks = new Map<string, Blockly.Block>()

    block.inputList.forEach((input) => {
        const targetBlock = input.connection?.targetBlock()
        if (targetBlock) {
            connectedBlocks.set(input.name, targetBlock)
        }
    })

    while (block.inputList.length > 0) {
        block.removeInput(block.inputList[0].name)
    }

    for (let index = 0; index < state.pairCount; index++) {
        block.appendValueInput(`WHEN${index}`).setCheck('Expr').appendField(index === 0 ? `${state.displayName} WHEN` : 'WHEN')
        block.appendValueInput(`THEN${index}`).setCheck('Expr').appendField('THEN')
    }

    block.appendValueInput('ELSE').setCheck('Expr').appendField('ELSE')
    block.appendDummyInput('FOOTER').appendField('END')
    connectedBlocks.forEach((targetBlock, inputName) => {
        const input = block.getInput(inputName)
        if (input?.connection && targetBlock.outputConnection) {
            input.connection.connect(targetBlock.outputConnection)
        }
    })
    block.setColour(320)
    block.setInputsInline(false)
    block.setOutput(true, 'Expr')
    block.setTooltip(state.formula)
}

Blockly.Blocks['case_when'] = {
    customContextMenu: function (this: CaseWhenBlock, options: any[]) {
        if (this.isInFlyout) return

        const state = getState(this)

        options.push({
            enabled: true,
            text: `${i18n.global.t('common.add')} (+)`,
            callback: () => {
                this.knCaseState = { ...state, pairCount: state.pairCount + 1 }
                updateShape(this)
                this.render()
            }
        })

        if (state.pairCount > 1) {
            options.push({
                enabled: true,
                text: `${i18n.global.t('common.delete')} (-)`,
                callback: () => {
                    this.knCaseState = { ...state, pairCount: state.pairCount - 1 }
                    updateShape(this)
                    this.render()
                }
            })
        }
    },
    init: function (this: CaseWhenBlock) {
        this.knCaseState = { ...defaultState }
        updateShape(this)
    },
    loadExtraState: function (this: CaseWhenBlock, state: IBlocklyCaseBlockState) {
        this.knCaseState = { ...defaultState, ...state }
        updateShape(this)
    },
    saveExtraState: function (this: CaseWhenBlock) {
        return { ...getState(this) }
    }
} as any
