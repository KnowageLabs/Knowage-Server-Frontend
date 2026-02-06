<template>
    <Dialog class="kn-dialog--toolbar--primary calculatedFieldDialogClass" :visible="visibility" :header="$t('components.knCalculatedField.title') + ' (Blockly)'" :closable="false" modal :breakpoints="{ '960px': '75vw', '640px': '100vw' }" @show="initBlockly" @hide="disposeBlockly">
        <Message severity="info" :closable="false">{{ $t('components.knCalculatedField.description') }}</Message>

        <div class="p-fluid p-grid">
            <div class="p-col">
                <span class="p-float-label p-field kn-flex">
                    <InputText id="colName" ref="colName" v-model="v$.cf.colName.$model" type="text" :disabled="readOnly" class="kn-material-input" :class="{ 'p-invalid': v$.cf.colName.$invalid }" @blur="v$.cf.colName.$touch()" />
                    <label class="kn-material-input-label"> {{ $t('components.knCalculatedField.columnName') }} </label>
                </span>
            </div>
        </div>

        <div class="p-grid p-m-0" style="height: 500px; border: 1px solid #ccc; position: relative">
            <div id="blocklyDiv" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0"></div>
        </div>

        <template #footer>
            <Button :class="readOnly ? 'kn-button kn-button--primary' : 'kn-button kn-button--secondary'" :label="$t('common.cancel')" @click="cancel" />
            <Button v-if="!readOnly" :label="$t('common.apply')" class="kn-button kn-button--primary" :disabled="v$.$invalid" @click="apply" />
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'
import useValidate from '@vuelidate/core'
import { createValidations } from '@/helpers/commons/validationHelper'
import * as Blockly from 'blockly'
import { javascriptGenerator } from 'blockly/javascript'

export default defineComponent({
    name: 'KnBlocklyCalculatedField',
    components: { Dialog, InputText, Button, Message },
    props: {
        fields: { type: Array as PropType<any[]>, default: () => [] },
        variables: Array,
        visibility: Boolean,
        readOnly: Boolean,
        descriptor: Object,
        template: Object,
        validation: Boolean,
        valid: Boolean,
        source: String,
        propCalcFieldFunctions: Array,
        propNullifFunction: Object
    },
    emits: ['save', 'cancel', 'update:readOnly'],
    setup() {
        return { v$: useValidate() }
    },
    data() {
        return {
            cf: { colName: '', formula: '', xml: '' },
            workspace: null as Blockly.WorkspaceSvg | null,
            generator: null as any
        }
    },
    validations() {
        if (this.descriptor) {
            return { cf: createValidations('cf', this.descriptor.validations) }
        }
        return { cf: { colName: {} } }
    },
    watch: {
        visibility(newVal) {
            if (newVal) {
                // CF initialization logic
                this.cf = { colName: '', formula: '', xml: '' }
                if (!this.readOnly && this.template) {
                    if (this.template.parameters) {
                        for (let i = 0; i < this.template.parameters.length; i++) {
                            if (this.template.parameters[i]['name'] == 'formula') this.cf.formula = this.template.parameters[i]['value']
                            else if (this.template.parameters[i]['name'] == 'colName') this.cf.colName = this.template.parameters[i]['value']
                            else if (this.template.parameters[i]['name'] == 'xml') this.cf.xml = this.template.parameters[i]['value']
                        }
                    } else if (this.source === 'QBE') {
                        this.cf = { colName: this.template.alias, formula: this.template.expression, xml: this.template.xml }
                    } else if (this.source === 'dashboard') {
                        this.cf = { colName: this.template.alias, formula: this.template.formula, xml: this.template.xml }
                    }
                }
            }
        }
    },
    methods: {
        initBlockly() {
            setTimeout(() => {
                const blocklyDiv = document.getElementById('blocklyDiv')
                if (!blocklyDiv) return // Pass fields to global scope so static block definition can access them
                ;(window as any).knBlocklyFields = this.fields
                ;(window as any).knBlocklyFunctions = this.propCalcFieldFunctions

                // Define Custom Field Block
                Blockly.Blocks['kn_field'] = {
                    init: function () {
                        this.appendDummyInput()
                            .appendField('Field')
                            .appendField(
                                new Blockly.FieldDropdown(function () {
                                    const fields = (window as any).knBlocklyFields
                                    if (!fields || fields.length === 0) return [['No fields', 'null']]
                                    return fields.map((f: any) => [f.fieldLabel || f.fieldAlias, f.fieldAlias])
                                }),
                                'FIELD'
                            )
                        this.setOutput(true, null)
                        this.setColour(160)
                        this.setTooltip('Select a dataset field')
                    }
                }

                // Define Aggregation Block
                Blockly.Blocks['kn_aggregation'] = {
                    init: function () {
                        this.appendValueInput('VALUE')
                            .setCheck(null)
                            .appendField(
                                new Blockly.FieldDropdown(function () {
                                    const funcs = (window as any).knBlocklyFunctions || []
                                    if (funcs.length === 0) return [['SUM', 'SUM']]
                                    // Sort by label for better UX
                                    const sorted = [...funcs].sort((a: any, b: any) => a.label.localeCompare(b.label))
                                    return sorted.map((f: any) => [f.label, f.name])
                                }),
                                'AGGREGATION'
                            )
                        this.setOutput(true, null)
                        this.setColour(230)
                        this.setTooltip('Aggregation function')
                    }
                }

                // Setup Generator
                this.generator = javascriptGenerator
                this.generator.forBlock['kn_field'] = (block: any) => {
                    const field = block.getFieldValue('FIELD')
                    const code = this.source === 'dashboard' ? '"' + field + '"' : '$F{' + field + '}'
                    return [code, this.generator.ORDER_ATOMIC]
                }
                this.generator.forBlock['kn_aggregation'] = (block: any) => {
                    const funcName = block.getFieldValue('AGGREGATION')
                    const value = this.generator.valueToCode(block, 'VALUE', this.generator.ORDER_NONE) || '0'

                    // Simple logic to handle special cases found in standard descriptions
                    // Typically: FUNC(arg)
                    // If COUNT_DISTINCT, we know it might need special handling if underlying engine requires "COUNT(DISTINCT x)"
                    // But if the engine is SQL-like, usually the function name is what matters.
                    // The 'formula' in descriptor is a hint.

                    // Try to find the function definition to see if we need special format
                    const funcs = (window as any).knBlocklyFunctions || []
                    const funcDef = funcs.find((f: any) => f.name === funcName)

                    // Get correct casing from definition formula property if available
                    // e.g. "sum(expr)" -> "sum"
                    let realFuncName = funcName
                    if (funcDef && funcDef.formula) {
                        const extracted = funcDef.formula.split('(')[0].trim()
                        if (extracted) realFuncName = extracted
                    }

                    let code = `${realFuncName}(${value})`
                    if (funcDef) {
                        if (funcName === 'COUNT_DISTINCT') {
                            code = `COUNT(DISTINCT ${value})`
                        } else if (funcName === 'COUNT') {
                            // Ensure COUNT is COUNT
                            code = `COUNT(${value})`
                        }
                    }

                    return [code, this.generator.ORDER_FUNCTION_CALL]
                }

                // Use a simple toolbox
                const toolbox = {
                    kind: 'categoryToolbox',
                    contents: [
                        {
                            kind: 'category',
                            name: 'Fields',
                            colour: '160',
                            contents: [{ kind: 'block', type: 'kn_field' }]
                        },
                        {
                            kind: 'category',
                            name: 'Aggregations',
                            colour: '230',
                            contents: [{ kind: 'block', type: 'kn_aggregation' }]
                        },
                        {
                            kind: 'category',
                            name: 'Math',
                            colour: '230',
                            contents: [
                                { kind: 'block', type: 'math_number' },
                                { kind: 'block', type: 'math_arithmetic' },
                                { kind: 'block', type: 'math_single' },
                                { kind: 'block', type: 'math_constant' }
                            ]
                        }
                    ]
                }

                this.workspace = Blockly.inject('blocklyDiv', {
                    toolbox: toolbox,
                    readOnly: this.readOnly,
                    trashcan: true,
                    move: {
                        scrollbars: true,
                        drag: true,
                        wheel: true
                    }
                })

                // Add listener to update formula in real-time
                this.workspace.addChangeListener(this.updateFormula)

                // If existing formula is present, try to warn user or load if possible (loading skipped for now as there is no parser)
                if (this.cf.xml) {
                    try {
                        const dom = Blockly.utils.xml.textToDom(this.cf.xml)
                        Blockly.Xml.domToWorkspace(dom, this.workspace)
                    } catch (e) {
                        if (this.cf.formula) {
                            this.loadFromFormula(this.cf.formula)
                        }
                    }
                } else if (this.cf.formula) {
                    this.loadFromFormula(this.cf.formula)
                }
            }, 200)
        },
        loadFromFormula(formula: string) {
            if (!formula) return

            const generateXML = (expr: string): string => {
                expr = expr.trim()

                // Special case: COUNT(DISTINCT ...)
                const countDistinctMatch = expr.match(/^COUNT\s*\(\s*DISTINCT\s+(.*)\)$/i)
                if (countDistinctMatch) {
                    const innerXML = generateXML(countDistinctMatch[1])
                    return `<block type="kn_aggregation"><field name="AGGREGATION">COUNT_DISTINCT</field><value name="VALUE">${innerXML}</value></block>`
                }

                // Generic Function match
                const funcMatch = expr.match(/^([a-zA-Z0-9_]+)\s*\((.*)\)$/)
                if (funcMatch) {
                    const funcName = funcMatch[1].toUpperCase()
                    const content = funcMatch[2]

                    const funcs = (window as any).knBlocklyFunctions || []
                    const funcDef = funcs.find((f: any) => f.name === funcName)

                    if (funcDef) {
                        const innerXML = generateXML(content)
                        return `<block type="kn_aggregation"><field name="AGGREGATION">${funcName}</field><value name="VALUE">${innerXML}</value></block>`
                    }
                }

                // Check Field - Dashboard: "alias"
                const quoteMatch = expr.match(/^"(.*)"$/)
                if (quoteMatch) {
                    const name = quoteMatch[1]
                    const field = this.findField(name)
                    if (field) {
                        return `<block type="kn_field"><field name="FIELD">${field.fieldAlias}</field></block>`
                    }
                }

                // Check Field - QBE/Other: $F{alias}
                const varMatch = expr.match(/^\$F\{(.*)\}$/)
                if (varMatch) {
                    const name = varMatch[1]
                    const field = this.findField(name)
                    const alias = field ? field.fieldAlias : name
                    return `<block type="kn_field"><field name="FIELD">${alias}</field></block>`
                }

                // Number
                if (!isNaN(parseFloat(expr)) && isFinite(expr as any)) {
                    return `<block type="math_number"><field name="NUM">${expr}</field></block>`
                }

                // Fallback: try to treat plain string as field
                const field = this.findField(expr)
                if (field) {
                    return `<block type="kn_field"><field name="FIELD">${field.fieldAlias}</field></block>`
                }

                return ''
            }

            const xmlString = `<xml>${generateXML(formula)}</xml>`
            try {
                if (this.workspace) Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(xmlString), this.workspace as any)
            } catch (e) {
                console.warn('Failed to parse formula to blocks', e)
            }
        },
        findField(name: string) {
            if (!this.fields) return null
            return this.fields.find((f: any) => f.fieldAlias === name || f.fieldLabel === name)
        },
        updateFormula(event: any) {
            if (event.type === Blockly.Events.UI) return
            if (!this.workspace || !this.generator) return

            const dom = Blockly.Xml.workspaceToDom(this.workspace)
            this.cf.xml = Blockly.Xml.domToText(dom)

            const topBlocks = this.workspace.getTopBlocks(false)
            if (topBlocks.length > 0) {
                // Use the generator instance method blockToCode which handles context correctly
                const codeTuple = this.generator.blockToCode(topBlocks[0])
                if (Array.isArray(codeTuple)) {
                    this.cf.formula = codeTuple[0]
                } else {
                    this.cf.formula = codeTuple || ''
                }
            } else {
                this.cf.formula = ''
            }
        },
        disposeBlockly() {
            if (this.workspace) {
                this.workspace.dispose()
                this.workspace = null
            }
        },
        apply() {
            // Formula is automatically updated by the workspace listener
            this.$emit('save', this.cf)
        },
        cancel() {
            this.$emit('update:readOnly', false)
            this.$emit('cancel', this.cf)
        }
    }
})
</script>

<style scoped>
.calculatedFieldDialogClass {
    min-width: 600px;
    width: 60%;
    max-width: 1200px;
}
#blocklyDiv {
    width: 100%;
    height: 100%;
}
</style>

<style>
/* Global overrides for Blockly to work inside Modal */
.blocklyDropDownDiv,
.blocklyWidgetDiv,
.blocklyTooltipDiv {
    z-index: 20000 !important;
}
</style>
