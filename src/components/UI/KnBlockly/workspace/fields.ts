import * as Blockly from 'blockly'
import { IBlocklyFieldOption } from '@/components/UI/KnBlockly/types'

export function setFieldOptions(workspace: Blockly.WorkspaceSvg, fields: IBlocklyFieldOption[]) {
    const validFields = fields.filter((field) => field?.value?.trim())
    const options: [string, string][] = validFields.length > 0 ? validFields.map((field) => [field.label, field.value]) : [['(no fields)', '']]

    workspace.getAllBlocks(false).forEach((b) => {
        if (b.type !== 'agg_field' && b.type !== 'field_ref') return

        const dd = b.getField('FIELD') as Blockly.FieldDropdown | null
        if (!dd) return

        const savedValue = dd.getValue()

        // @ts-ignore Blockly exposes menuGenerator_ as a protected member.
        dd.menuGenerator_ = options

        if (savedValue && validFields.some((field) => field.value === savedValue)) {
            dd.setValue(savedValue)
        } else if (validFields.length > 0) {
            dd.setValue(validFields[0].value)
        }

        if ((dd as any).forceRerender) {
            dd.forceRerender()
        } else if ((dd as any).sourceBlock_?.rendered) {
            ;(dd as any).sourceBlock_.render()
        }
    })
}
