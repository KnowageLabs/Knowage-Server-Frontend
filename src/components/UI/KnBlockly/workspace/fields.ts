import * as Blockly from 'blockly'

export function setFieldOptions(workspace: Blockly.WorkspaceSvg, fields: string[]) {
    // Filtra e valida i campi - deve essere un array di stringhe non vuote
    const validFields = fields.filter((f): f is string => typeof f === 'string' && f.trim().length > 0).map((f) => f.trim())

    console.log('[setFieldOptions] validFields:', validFields)

    const options: [string, string][] = validFields.length > 0 ? validFields.map((f) => [f, f]) : [['(no fields)', '']]

    workspace.getAllBlocks(false).forEach((b) => {
        if (b.type !== 'agg_field') return

        const dd = b.getField('FIELD') as Blockly.FieldDropdown | null
        if (!dd) return

        // Salva il valore corrente (potrebbe essere stato caricato dal JSON)
        const savedValue = dd.getValue()
        console.log('[setFieldOptions] savedValue dal blocco:', savedValue)

        // Aggiorna il menuGenerator
        dd.menuGenerator_ = options

        // Se c'è un valore salvato valido, usalo. Altrimenti usa il primo campo
        if (savedValue && validFields.includes(savedValue)) {
            console.log('[setFieldOptions] Mantengo savedValue:', savedValue)
            dd.setValue(savedValue)
        } else if (validFields.length > 0) {
            console.log('[setFieldOptions] Imposto primo campo:', validFields[0])
            dd.setValue(validFields[0])
        }

        // Forza il re-render del campo
        if (dd.sourceBlock_ && dd.sourceBlock_.rendered) {
            dd.forceRerender()
        }

        console.log('[setFieldOptions] Valore finale:', dd.getValue())
    })
}
