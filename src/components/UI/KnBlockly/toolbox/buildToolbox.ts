import dashboardToolbox from '@/components/UI/KnBlockly/toolbox/toolbox.json'
import { BlocklyEditorType, IBlocklyFunctionBlockState, IBlocklyFunctionDefinition } from '@/components/UI/KnBlockly/types'

type ToolboxCategory = {
    kind: 'category'
    name: string
    contents: any[]
}

const CASE_PATTERN = /^CASE\s+WHEN/i
const SINGLE_ARGUMENT_QBE_AGGREGATIONS = new Set(['sum', 'avg', 'min', 'max', 'count'])

function splitArgs(input: string): string[] {
    return input
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
}

function normalizeArgumentLabel(label: string, index: number): string {
    const normalized = label.replace(/[\[\]]/g, '').trim()
    return normalized.length > 0 ? normalized : `arg${index + 1}`
}

function createFunctionBlockState(definition: IBlocklyFunctionDefinition, editorType: BlocklyEditorType): IBlocklyFunctionBlockState {
    const trimmedFormula = definition.formula?.trim() ?? ''
    const match = trimmedFormula.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*)\)$/)
    const callName = match?.[1] ?? definition.name
    const argsSection = match?.[2]?.trim() ?? ''
    const optionalMatch = argsSection.match(/\[\s*,\s*([^\]]+)\]/)
    const optionalLabels = optionalMatch ? splitArgs(optionalMatch[1]) : []
    const argsWithoutOptional = argsSection.replace(/\[\s*,\s*[^\]]+\]/g, '').trim()
    const supportsVariableArgs = /(?:\.\.\.|…)/.test(argsWithoutOptional)
    const variablePrefix = supportsVariableArgs ? argsWithoutOptional.split(/(?:\.\.\.|…)/)[0] : argsWithoutOptional
    const requiredLabels = splitArgs(variablePrefix)
    const argLabels = [...requiredLabels, ...optionalLabels].map(normalizeArgumentLabel)

    if (editorType === 'qbe' && definition.category === 'AGGREGATION' && SINGLE_ARGUMENT_QBE_AGGREGATIONS.has(callName.toLowerCase())) {
        const argumentLabel = normalizeArgumentLabel(requiredLabels[0] ?? optionalLabels[0] ?? 'expr', 0)
        return {
            argCount: 1,
            argLabels: [argumentLabel],
            callName,
            displayName: definition.label || callName,
            formula: `${callName}(${argumentLabel})`,
            maxArgs: 1,
            minArgs: 1,
            supportsVariableArgs: false
        }
    }

    if (!argsSection) {
        return {
            argCount: 0,
            argLabels: [],
            callName,
            displayName: definition.label || callName,
            formula: trimmedFormula,
            maxArgs: 0,
            minArgs: 0,
            supportsVariableArgs: false
        }
    }

    if (supportsVariableArgs) {
        const minimumArgs = requiredLabels.length > 0 ? requiredLabels.length : 1
        return {
            argCount: minimumArgs,
            argLabels,
            callName,
            displayName: definition.label || callName,
            formula: trimmedFormula,
            maxArgs: null,
            minArgs: minimumArgs,
            supportsVariableArgs: true
        }
    }

    const minimumArgs = requiredLabels.length
    const maximumArgs = minimumArgs + optionalLabels.length

    return {
        argCount: minimumArgs,
        argLabels,
        callName,
        displayName: definition.label || callName,
        formula: trimmedFormula,
        maxArgs: maximumArgs,
        minArgs: minimumArgs,
        supportsVariableArgs: optionalLabels.length > 0
    }
}

function createFunctionToolboxBlock(definition: IBlocklyFunctionDefinition, editorType: BlocklyEditorType) {
    if (CASE_PATTERN.test(definition.formula)) {
        return {
            extraState: {
                displayName: definition.label || definition.name,
                formula: definition.formula,
                pairCount: 1
            },
            kind: 'block',
            type: 'case_when'
        }
    }

    return {
        extraState: createFunctionBlockState(definition, editorType),
        kind: 'block',
        type: 'function_call'
    }
}

function createCategory(name: string, contents: any[]): ToolboxCategory {
    return {
        contents,
        kind: 'category',
        name
    }
}

function createQbeToolbox(functionDefinitions: IBlocklyFunctionDefinition[], hasVariables: boolean) {
    const categories: ToolboxCategory[] = [createCategory('Fields', [{ kind: 'block', type: 'field_ref' }])]

    if (hasVariables) {
        categories.push(createCategory('Variables', [{ kind: 'block', type: 'variable' }]))
    }

    const groupedFunctions = new Map<string, IBlocklyFunctionDefinition[]>()

    functionDefinitions.forEach((definition) => {
        const categoryName = definition.category || 'Functions'
        if (!groupedFunctions.has(categoryName)) {
            groupedFunctions.set(categoryName, [])
        }
        groupedFunctions.get(categoryName)?.push(definition)
    })

    groupedFunctions.forEach((definitions, categoryName) => {
        categories.push(createCategory(categoryName, definitions.map((definition) => createFunctionToolboxBlock(definition, 'qbe'))))
    })

    categories.push(
        createCategory('Text', [{ kind: 'block', type: 'text' }]),
        createCategory('Math', [{ kind: 'block', type: 'math_number' }, { kind: 'block', type: 'math_arithmetic' }]),
        createCategory('Logic', [{ kind: 'block', type: 'logic_compare' }, { kind: 'block', type: 'logic_operation' }, { kind: 'block', type: 'logic_negate' }, { kind: 'block', type: 'logic_boolean' }])
    )

    return {
        contents: categories.filter((category) => category.contents.length > 0),
        kind: 'categoryToolbox'
    }
}

export function buildToolbox(editorType: BlocklyEditorType, functionDefinitions: IBlocklyFunctionDefinition[], hasVariables: boolean) {
    if (editorType === 'qbe') {
        return createQbeToolbox(functionDefinitions, hasVariables)
    }

    const toolbox = JSON.parse(JSON.stringify(dashboardToolbox))

    if (!hasVariables) {
        toolbox.contents = toolbox.contents.filter((category: { name: string }) => category.name !== 'Variables')
    }

    return toolbox
}
