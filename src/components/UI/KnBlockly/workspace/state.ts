import * as Blockly from 'blockly'

export function workspaceToState(ws: Blockly.WorkspaceSvg) {
    return Blockly.serialization.workspaces.save(ws)
}

export function normalizeStateInput(input: unknown): any | null {
    if (!input) return null

    if (typeof input === 'string') {
        const s = input.trim()
        if (!s) return null
        try {
            return JSON.parse(s)
        } catch {
            return null
        }
    }

    if (typeof input === 'object') return input
    return null
}

export function getInitialMode(initialState: unknown): 'blockly' | 'text' {
    const state = normalizeStateInput(initialState)
    if (!state) return 'blockly'

    // Se lo stato ha una modalità esplicita, usala
    if (state.mode === 'text' || state.mode === 'blockly') {
        return state.mode
    }

    // Altrimenti è un legacy state (XML puro) -> trattalo come blockly
    return 'blockly'
}

export function extractBlocklyXmlFromState(state: any): any | null {
    if (!state) return null

    // Se è uno stato strutturato con modalità
    if (state.mode === 'blockly' && state.blocklyXml) {
        return state.blocklyXml
    }

    // Se è uno stato legacy (XML puro), usalo direttamente
    if (state.blocks || state.variables) {
        return state
    }

    return null
}

export function extractDslFromState(state: any): string {
    if (!state) return ''

    // Se è uno stato strutturato con modalità text
    if (state.mode === 'text' && state.dsl) {
        return state.dsl
    }

    return ''
}
