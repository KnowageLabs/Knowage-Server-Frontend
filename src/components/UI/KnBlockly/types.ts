export type BlocklyEditorType = 'dashboard' | 'qbe'

export interface IBlocklyFieldOption {
    label: string
    value: string
}

export interface IBlocklyValidationField {
    name: string
    alias: string
}

export interface IBlocklyFunctionDefinition {
    category: string
    formula: string
    label: string
    name: string
    help?: string
}

export interface IBlocklyFunctionBlockState {
    argCount: number
    argLabels: string[]
    callName: string
    displayName: string
    formula: string
    maxArgs: number | null
    minArgs: number
    supportsVariableArgs: boolean
}

export interface IBlocklyCaseBlockState {
    displayName: string
    formula: string
    pairCount: number
}
