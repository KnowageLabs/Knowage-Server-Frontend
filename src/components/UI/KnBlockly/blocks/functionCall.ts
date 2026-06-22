import * as Blockly from 'blockly'
import i18n from '@/App.i18n'
import { IBlocklyFunctionBlockState } from '@/components/UI/KnBlockly/types'

type FunctionCallBlock = Blockly.Block & {
    knFunctionState?: IBlocklyFunctionBlockState
    customContextMenu?: (options: any[]) => void
    loadExtraState?: (state: IBlocklyFunctionBlockState) => void
    saveExtraState?: () => IBlocklyFunctionBlockState
    updateShape_?: () => void
}

const defaultState: IBlocklyFunctionBlockState = {
    argCount: 1,
    argLabels: ['arg1'],
    callName: 'function',
    displayName: 'Function',
    formula: '',
    maxArgs: 1,
    minArgs: 1,
    supportsVariableArgs: false
}

function getState(block: FunctionCallBlock): IBlocklyFunctionBlockState {
    return block.knFunctionState ?? defaultState
}

function getArgumentLabel(block: FunctionCallBlock, index: number) {
    return getState(block).argLabels[index] ?? `arg${index + 1}`
}

function updateShape(block: FunctionCallBlock) {
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

    if (state.argCount === 0) {
        block.appendDummyInput('HEADER').appendField(`${state.displayName}()`)
    } else {
        block.appendValueInput('ARG0').setCheck('Expr').appendField(`${state.displayName}(`).appendField(getArgumentLabel(block, 0))

        for (let index = 1; index < state.argCount; index++) {
            block.appendValueInput(`ARG${index}`).setCheck('Expr').appendField(',').appendField(getArgumentLabel(block, index))
        }

        block.appendDummyInput('FOOTER').appendField(')')
    }

    connectedBlocks.forEach((targetBlock, inputName) => {
        const input = block.getInput(inputName)
        if (input?.connection && targetBlock.outputConnection) {
            input.connection.connect(targetBlock.outputConnection)
        }
    })

    block.setColour(290)
    block.setInputsInline(true)
    block.setOutput(true, 'Expr')
    block.setTooltip(state.formula || state.displayName)
}

Blockly.Blocks['function_call'] = {
    customContextMenu: function (this: FunctionCallBlock, options: any[]) {
        if (this.isInFlyout) return

        const state = getState(this)
        const canAddArgument = state.supportsVariableArgs && (state.maxArgs === null || state.argCount < state.maxArgs)
        const canRemoveArgument = state.argCount > state.minArgs

        if (canAddArgument) {
            options.push({
                enabled: true,
                text: `${i18n.global.t('common.add')} (+)`,
                callback: () => {
                    this.knFunctionState = { ...state, argCount: state.argCount + 1 }
                    updateShape(this)
                    this.render()
                }
            })
        }

        if (canRemoveArgument) {
            options.push({
                enabled: true,
                text: `${i18n.global.t('common.delete')} (-)`,
                callback: () => {
                    this.knFunctionState = { ...state, argCount: state.argCount - 1 }
                    updateShape(this)
                    this.render()
                }
            })
        }
    },
    init: function (this: FunctionCallBlock) {
        this.knFunctionState = { ...defaultState, argLabels: [...defaultState.argLabels] }
        updateShape(this)
    },
    loadExtraState: function (this: FunctionCallBlock, state: IBlocklyFunctionBlockState) {
        this.knFunctionState = { ...defaultState, ...state, argLabels: state?.argLabels ? [...state.argLabels] : [...defaultState.argLabels] }
        updateShape(this)
    },
    saveExtraState: function (this: FunctionCallBlock) {
        const state = getState(this)
        return { ...state, argLabels: [...state.argLabels] }
    }
} as any
