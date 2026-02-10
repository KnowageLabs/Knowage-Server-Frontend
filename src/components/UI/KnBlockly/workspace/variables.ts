import * as Blockly from 'blockly'

export function setVariableOptions(ws: Blockly.Workspace, variables: any[]) {
    const validVariables = variables.filter((v): v is any => v?.name && typeof v.name === 'string' && v.name.trim().length > 0)

    console.log('[setVariableOptions] validVariables:', validVariables)

    const options: [string, string][] = validVariables.length > 0 ? validVariables.map((v) => [v.name, v.name]) : [['(no variables)', '']]

    ws.getAllBlocks(false).forEach((b) => {
        if (b.type !== 'variable') return

        const dd = b.getField('VAR_NAME') as Blockly.FieldDropdown | null
        if (!dd) return

        // Salva il valore corrente prima di cambiare le opzioni
        const savedValue = dd.getValue()
        console.log('[setVariableOptions] savedValue dal blocco:', savedValue)

        // @ts-ignore - accesso protetto ma necessario
        dd.menuGenerator_ = options

        // Se c'è un valore salvato valido, usalo. Altrimenti usa la prima variabile
        if (savedValue && validVariables.find((v) => v.name === savedValue)) {
            console.log('[setVariableOptions] Mantengo savedValue:', savedValue)
            dd.setValue(savedValue)
        } else if (validVariables.length > 0) {
            console.log('[setVariableOptions] Imposto prima variabile:', validVariables[0].name)
            dd.setValue(validVariables[0].name)
        }

        // @ts-ignore - accesso protetto
        if (dd.sourceBlock_ && dd.sourceBlock_.rendered) {
            // @ts-ignore
            dd.sourceBlock_.render()
        }

        console.log('[setVariableOptions] Valore finale:', dd.getValue())
    })
}
