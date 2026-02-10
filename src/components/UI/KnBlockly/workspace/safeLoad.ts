import * as Blockly from 'blockly'

export function safeLoadState(ws: Blockly.WorkspaceSvg, state: any, postLoad?: () => void) {
    const fieldValues = new Map<string, string>()
    if (state?.blocks?.blocks) {
        const extractFieldValues = (block: any) => {
            if (block.type === 'agg_field' && block.fields?.FIELD) {
                fieldValues.set(block.id, block.fields.FIELD)
                console.log('[safeLoadState] Trovato valore FIELD da preservare:', block.id, '=', block.fields.FIELD)
            }
            if (block.inputs) {
                Object.values(block.inputs).forEach((input: any) => {
                    if (input.block) extractFieldValues(input.block)
                })
            }
            if (block.next?.block) extractFieldValues(block.next.block)
        }
        state.blocks.blocks.forEach(extractFieldValues)
    }

    Blockly.Events.disable()
    try {
        ws.clear()
        Blockly.serialization.workspaces.load(state, ws)

        ws.getAllBlocks(false).forEach((b) => {
            if (b.type === 'agg_field') {
                const savedFieldValue = fieldValues.get(b.id)
                if (savedFieldValue) {
                    const fieldDropdown = b.getField('FIELD') as Blockly.FieldDropdown | null
                    if (fieldDropdown) {
                        ;(fieldDropdown as any).value_ = savedFieldValue
                        console.log('[safeLoadState] Ripristinato FIELD:', b.id, '=', savedFieldValue)
                    }
                }
            }
        })
    } finally {
        Blockly.Events.enable()
    }

    postLoad?.()

    requestAnimationFrame(() => {
        Blockly.svgResize(ws)
    })
}
