const SINGLE_ARGUMENT_QBE_AGGREGATIONS = new Set(['sum', 'avg', 'min', 'max', 'count'])

export function getInvalidQbeAggregationNamesFromFormula(formula: string | undefined) {
    const invalidFunctions = new Set<string>()
    const normalizedFormula = String(formula ?? '')
    let currentQuote = ''

    for (let index = 0; index < normalizedFormula.length; index++) {
        if (currentQuote) {
            if (normalizedFormula[index] === currentQuote) currentQuote = ''
            continue
        }

        if (normalizedFormula[index] === "'" || normalizedFormula[index] === '"') {
            currentQuote = normalizedFormula[index]
            continue
        }

        if (!/[a-zA-Z_]/.test(normalizedFormula[index])) continue
        if (index > 0 && /[a-zA-Z0-9_]/.test(normalizedFormula[index - 1])) continue

        const functionMatch = normalizedFormula.slice(index).match(/^([a-zA-Z_][a-zA-Z0-9_]*)/)
        const functionName = functionMatch?.[1]
        if (!functionName || !SINGLE_ARGUMENT_QBE_AGGREGATIONS.has(functionName.toLowerCase())) continue

        let openParenthesisIndex = index + functionName.length
        while (normalizedFormula[openParenthesisIndex] === ' ') openParenthesisIndex++
        if (normalizedFormula[openParenthesisIndex] !== '(') continue

        const closeParenthesisIndex = findMatchingParenthesis(normalizedFormula, openParenthesisIndex)
        if (closeParenthesisIndex === -1) continue

        const argumentsList = splitFunctionArguments(normalizedFormula.slice(openParenthesisIndex + 1, closeParenthesisIndex))
        if (argumentsList.length > 1) invalidFunctions.add(functionName.toLowerCase())
    }

    return [...invalidFunctions]
}

function findMatchingParenthesis(formula: string, openParenthesisIndex: number) {
    let depth = 0
    let currentQuote = ''

    for (let index = openParenthesisIndex; index < formula.length; index++) {
        const character = formula[index]

        if (currentQuote) {
            if (character === currentQuote) currentQuote = ''
            continue
        }

        if (character === "'" || character === '"') {
            currentQuote = character
            continue
        }

        if (character === '(') depth++
        if (character === ')') {
            depth--
            if (depth === 0) return index
        }
    }

    return -1
}

function splitFunctionArguments(argumentsList: string) {
    const argumentsArray = [] as string[]
    let currentArgument = ''
    let depth = 0
    let currentQuote = ''

    for (let index = 0; index < argumentsList.length; index++) {
        const character = argumentsList[index]

        if (currentQuote) {
            currentArgument += character
            if (character === currentQuote) currentQuote = ''
            continue
        }

        if (character === "'" || character === '"') {
            currentQuote = character
            currentArgument += character
            continue
        }

        if (character === '(') {
            depth++
            currentArgument += character
            continue
        }

        if (character === ')') {
            depth--
            currentArgument += character
            continue
        }

        if (character === ',' && depth === 0) {
            if (currentArgument.trim().length > 0) argumentsArray.push(currentArgument.trim())
            currentArgument = ''
            continue
        }

        currentArgument += character
    }

    if (currentArgument.trim().length > 0) argumentsArray.push(currentArgument.trim())

    return argumentsArray
}
