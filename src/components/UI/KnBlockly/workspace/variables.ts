import * as Blockly from 'blockly'

export function setVariableOptions(ws: Blockly.Workspace, variables: any[]) {
    const validVariables = variables.filter((v): v is any => v?.name && typeof v.name === 'string' && v.name.trim().length > 0)
    const options: [string, string][] = validVariables.length > 0 ? validVariables.map((v) => [v.name, v.name]) : [['(no variables)', '']]

    ws.getAllBlocks(false).forEach((b) => {
        if (b.type !== 'variable') return

        const dd = b.getField('VAR_NAME') as Blockly.FieldDropdown | null
        if (!dd) return

        const savedValue = dd.getValue()

        // @ts-ignore Blockly exposes menuGenerator_ as a protected member.
        dd.menuGenerator_ = options

        if (savedValue && validVariables.find((v) => v.name === savedValue)) {
            dd.setValue(savedValue)
        } else if (validVariables.length > 0) {
            dd.setValue(validVariables[0].name)
        }

        if ((dd as any).forceRerender) {
            dd.forceRerender()
        } else if ((dd as any).sourceBlock_?.rendered) {
            ;(dd as any).sourceBlock_.render()
        }
    })
}
