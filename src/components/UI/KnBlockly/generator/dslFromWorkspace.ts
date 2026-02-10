import * as Blockly from 'blockly'
import { dslGenerator } from './dslGenerator'
import i18n from '@/App.i18n'

function findRoot(ws: Blockly.Workspace): Blockly.Block | null {
    const roots = ws.getTopBlocks(false).filter((b) => b.type === 'calc_root')
    return roots[0] ?? null
}

export function generateDslFromWorkspace(ws: Blockly.Workspace): string {
    const root = findRoot(ws)
    if (!root) return ''
    const code = dslGenerator.blockToCode(root)
    return String(code ?? '').trim()
}

export function validateWorkspace(ws: Blockly.Workspace, fields: string[]): string[] {
    const errs: string[] = []

    const top = ws.getTopBlocks(false)
    const roots = top.filter((b) => b.type === 'calc_root')

    if (roots.length === 0) errs.push(i18n.global.t('knBlockly.validation.missingRoot'))
    if (roots.length > 1) errs.push(i18n.global.t('knBlockly.validation.multipleRoots'))

    const root = roots[0]
    if (root) {
        const expr = root.getInputTargetBlock('EXPR')
        if (!expr) errs.push(i18n.global.t('knBlockly.validation.rootNoExpression'))
    }

    const extraTop = top.filter((b) => b.type !== 'calc_root')
    if (extraTop.length) errs.push(i18n.global.t('knBlockly.validation.disconnectedBlocks'))

    ws.getAllBlocks(false).forEach((b) => {
        if (b.type !== 'agg_field') return
        const field = b.getFieldValue('FIELD') || ''
        if (!field) errs.push(i18n.global.t('knBlockly.validation.fieldNotSelected'))
        else if (fields.length && !fields.includes(field)) errs.push(i18n.global.t('knBlockly.validation.fieldNotInList', { field }))
    })

    const dsl = generateDslFromWorkspace(ws)
    if (dsl.includes('MISSING_FIELD')) errs.push(i18n.global.t('knBlockly.validation.incompleteExpression'))
    if (dsl.includes('MISSING_VARIABLE')) errs.push(i18n.global.t('knBlockly.validation.variableNotSelected'))

    return errs
}
