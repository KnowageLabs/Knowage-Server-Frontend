import deepcopy from 'deepcopy'

interface Config {
    alias: string
    blocklyXml?: any
    expression: string
    format?: string
    formulaEditor?: string
    nature: string
    type: string
}

interface FormulaField {
    alias: string
    id: unknown
}

interface CalculatedFieldLike {
    type?: string
    formula?: string
    formulaEditor?: string
    expression?: string
    id?: {
        expression?: string
        expressionSimple?: string
    }
}

export function buildCalculatedField(calcFieldOutput, selectedQueryFields) {
    let calculatedField = {} as any
    let addedParameters = {} as any

    addedParameters.alias = calcFieldOutput.alias
    addedParameters.type = calcFieldOutput.type
    addedParameters.nature = calcFieldOutput.nature
    addedParameters.expressionSimple = calcFieldOutput.expression
    addedParameters.expression = getCalculatedFieldExpressionForAPI(calcFieldOutput.expression, selectedQueryFields)
    addedParameters.type === 'DATE' ? (addedParameters.format = calcFieldOutput.format) : ''

    calculatedField.id = addedParameters
    calculatedField.alias = addedParameters.alias
    calculatedField.nature = addedParameters.nature
    calculatedField.type = 'inline.calculated.field'
    calculatedField.distinct = false
    addedParameters.type === 'DATE' ? (calculatedField.format = calcFieldOutput.format) : ''
    calculatedField.fieldType = calcFieldOutput.nature.toLowerCase()
    calculatedField.entity = calcFieldOutput.alias
    calculatedField.field = calcFieldOutput.alias
    calculatedField.funct = calcFieldOutput.nature == 'MEASURE' ? 'SUM' : ''
    calculatedField.group = calcFieldOutput.nature == 'ATTRIBUTE' ? true : false
    calculatedField.order = 'NONE'
    calculatedField.include = true
    calculatedField.inUse = true
    calculatedField.visible = true
    calculatedField.id.expression = cleanExpression(calculatedField.id.expression)
    calculatedField.id.expressionSimple = cleanExpression(calculatedField.id.expressionSimple)
    calculatedField.formula = cleanExpression(addedParameters.expression)
    calculatedField.expression = cleanExpression(addedParameters.expressionSimple)
    calculatedField.formulaEditor = cleanExpression(calcFieldOutput.formulaEditor ?? addedParameters.expressionSimple)
    calculatedField.longDescription = cleanExpression(addedParameters.alias + ' : ' + addedParameters.alias)
    if (calcFieldOutput.blocklyXml) calculatedField.blocklyXml = deepcopy(calcFieldOutput.blocklyXml)

    return calculatedField
}

export function updateCalculatedField(fieldToUpdate, calcFieldOutput, selectedQueryFields) {
    let calculatedField = {} as any
    let addedParameters = {} as any

    addedParameters.alias = calcFieldOutput.alias
    addedParameters.type = calcFieldOutput.type
    addedParameters.nature = calcFieldOutput.nature
    addedParameters.expressionSimple = calcFieldOutput.expression
    addedParameters.expression = getCalculatedFieldExpressionForAPI(calcFieldOutput.expression, selectedQueryFields)
    addedParameters.type === 'DATE' ? (addedParameters.format = calcFieldOutput.format) : ''

    calculatedField.id = addedParameters
    calculatedField.alias = addedParameters.alias
    calculatedField.nature = addedParameters.nature
    calculatedField.type = 'inline.calculated.field'
    calculatedField.distinct = false
    addedParameters.type === 'DATE' ? (calculatedField.format = calcFieldOutput.format) : ''
    calculatedField.fieldType = calcFieldOutput.nature.toLowerCase()
    calculatedField.entity = calcFieldOutput.alias
    calculatedField.field = calcFieldOutput.alias
    calculatedField.group = fieldToUpdate.group
    calculatedField.order = fieldToUpdate.order
    calculatedField.funct = fieldToUpdate.funct
    calculatedField.visible = fieldToUpdate.visible
    calculatedField.inUse = fieldToUpdate.inUse
    calculatedField.include = true
    calculatedField.id.expression = cleanExpression(calculatedField.id.expression)
    calculatedField.id.expressionSimple = cleanExpression(calculatedField.id.expressionSimple)
    calculatedField.formula = cleanExpression(addedParameters.expression)
    calculatedField.expression = cleanExpression(addedParameters.expressionSimple)
    calculatedField.formulaEditor = cleanExpression(calcFieldOutput.formulaEditor ?? addedParameters.expressionSimple)
    calculatedField.longDescription = cleanExpression(addedParameters.alias + ' : ' + addedParameters.alias)
    calculatedField.uniqueID = fieldToUpdate.uniqueID
    calculatedField.iconCls = fieldToUpdate.iconCls
    if (calcFieldOutput.blocklyXml) calculatedField.blocklyXml = deepcopy(calcFieldOutput.blocklyXml)

    return calculatedField
}

export function normalizeCalculatedFieldForAPI(calculatedField: CalculatedFieldLike, selectedQueryFields: FormulaField[]) {
    if (!calculatedField || calculatedField.type !== 'inline.calculated.field') return calculatedField

    const sourceExpression =
        calculatedField.formulaEditor ??
        calculatedField.id?.expressionSimple ??
        calculatedField.expression ??
        calculatedField.formula ??
        calculatedField.id?.expression ??
        ''
    const backendExpression = getCalculatedFieldExpressionForAPI(sourceExpression, selectedQueryFields)

    if (calculatedField.id) calculatedField.id.expression = backendExpression
    calculatedField.formula = backendExpression

    return calculatedField
}

function getCalculatedFieldExpressionForAPI(formula: string, selectedQueryFields: FormulaField[]) {
    return cleanExpression(formula).replace(/\$F\{([^}]+)\}/g, (match, fieldAlias) => {
        const fieldToReplace = selectedQueryFields.find((value) => value.alias === fieldAlias)
        return typeof fieldToReplace?.id === 'string' ? fieldToReplace.id : match
    })
}

function cleanExpression(expression: string | undefined) {
    return String(expression ?? '').replaceAll(/\u00a0/g, ' ')
}
