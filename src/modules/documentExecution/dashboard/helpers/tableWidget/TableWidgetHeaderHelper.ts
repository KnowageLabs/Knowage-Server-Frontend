import { ITableWidgetHeadersRule, IVariable, IWidget } from '../../Dashboard'

export const synchronizeTableWidgetHeaderVariableLabels = (widget: IWidget, variables: IVariable[] = []) => {
    if (widget.type !== 'table') return

    const rules = widget.settings?.configuration?.headers?.custom?.rules
    if (!rules) return

    rules.forEach((rule: ITableWidgetHeadersRule) => {
        if (rule.action !== 'setLabel' || rule.compareType !== 'variable' || !rule.variable) return

        const variable = variables.find((variable: IVariable) => variable.name === rule.variable)
        if (!variable) return

        if (variable.type === 'dataset' && !variable.column) {
            rule.value = rule.variableKey && variable.pivotedValues ? variable.pivotedValues[rule.variableKey] ?? '' : ''
        } else {
            rule.value = variable.value ?? ''
        }
    })
}
