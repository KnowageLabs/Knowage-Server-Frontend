<template>
    <Dialog class="kn-dialog--toolbar--primary calculatedFieldDialogClass" :visible="visibility" :header="$t('components.knCalculatedField.title') + ' (Blockly)'" :closable="false" modal :breakpoints="{ '960px': '75vw', '640px': '100vw' }" @show="initBlockly" @hide="disposeBlockly">
        <Message severity="info" :closable="false">{{ $t('components.knCalculatedField.description') }}</Message>

        <div class="p-fluid p-grid">
            <div class="p-col">
                <span class="p-float-label p-field kn-flex">
                    <InputText id="colName" v-model="v$.cf.colName.$model" type="text" :disabled="readOnly" class="kn-material-input" :class="{ 'p-invalid': v$.cf.colName.$invalid }" @blur="v$.cf.colName.$touch()" />
                    <label class="kn-material-input-label"> {{ $t('components.knCalculatedField.columnName') }} </label>
                </span>
            </div>
        </div>

        <!-- Formula salvata (read-only) -->
        <div v-if="savedFormula" class="saved-formula-section p-mb-3">
            <div class="section-header p-d-flex p-ai-center p-mb-2">
                <i class="pi pi-bookmark p-mr-2"></i>
                <span class="section-title">Formula attuale (salvata)</span>
            </div>
            <div class="saved-formula-display p-p-3">
                <code>{{ savedFormula }}</code>
            </div>
        </div>

        <!-- Nuova formula (editabile) -->
        <div class="new-formula-section">
            <div class="section-header p-d-flex p-ai-center p-mb-2">
                <i class="pi pi-pencil p-mr-2"></i>
                <span class="section-title">{{ savedFormula ? 'Nuova formula' : 'Formula' }}</span>
            </div>
            <div class="p-grid p-m-0" style="height: 400px; border: 1px solid #ccc; position: relative">
                <div :id="blocklyDivId" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0"></div>
            </div>
            <!-- Preview della formula generata -->
            <div v-if="cf.formula" class="formula-preview p-mt-2 p-p-2">
                <small class="p-text-secondary">Preview: </small>
                <code>{{ cf.formula }}</code>
            </div>
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

// Flag per applicare i patch una sola volta
let patchesApplied = false
let lastGoodState: string | null = null
let isRestoring = false
let currentWorkspace: any = null
let restoreScheduled = false
let isDropdownOpen = false

// Funzione per salvare lo stato corrente
function saveGoodState(workspace: any) {
    if (!workspace || isRestoring) return
    try {
        const dom = Blockly.Xml.workspaceToDom(workspace)
        lastGoodState = Blockly.Xml.domToText(dom)
    } catch (e) {
        // Ignora errori di salvataggio
    }
}

// Funzione per ripristinare lo stato (con debounce)
function scheduleRestore() {
    if (restoreScheduled || isRestoring || !currentWorkspace || !lastGoodState) return
    if (currentWorkspace.isDragging && currentWorkspace.isDragging()) return
    // Se l'utente sta interagendo con un dropdown, non fare restore (altrimenti resetti la selezione)
    if (isDropdownOpen) return

    restoreScheduled = true

    setTimeout(() => {
        restoreScheduled = false
        if (!currentWorkspace || !lastGoodState || isRestoring) return
        if (currentWorkspace.isDragging && currentWorkspace.isDragging()) return
        if (isDropdownOpen) return

        isRestoring = true
        try {
            currentWorkspace.clear()
            const dom = Blockly.utils.xml.textToDom(lastGoodState)
            Blockly.Xml.domToWorkspace(dom, currentWorkspace)
        } catch (e) {
            console.warn('[KnBlockly] Errore durante restore:', e)
        } finally {
            setTimeout(() => {
                isRestoring = false
            }, 300)
        }
    }, 300)
}

if (!patchesApplied) {
    patchesApplied = true

    // Patch per disabilitare bumpNeighbours che causa lo spostamento dei blocchi
    const originalBumpNeighbours = (Blockly as any).BlockSvg?.prototype?.bumpNeighbours
    if (originalBumpNeighbours && !(originalBumpNeighbours as any).__patched) {
        ;(Blockly as any).BlockSvg.prototype.bumpNeighbours = function () {
            return
        }
        ;((Blockly as any).BlockSvg.prototype.bumpNeighbours as any).__patched = true
    }

    // Patch per ignorare gli errori di Blockly e schedulare il restore
    const originalRemoveConnection = (Blockly as any).ConnectionDB?.prototype?.removeConnection
    if (originalRemoveConnection && !(originalRemoveConnection as any).__patched) {
        const patchedRemoveConnection = function (this: any, connection: any, yPos: number) {
            try {
                return originalRemoveConnection.call(this, connection, yPos)
            } catch (e: any) {
                scheduleRestore()
                return
            }
        }
        ;(patchedRemoveConnection as any).__patched = true
        ;(Blockly as any).ConnectionDB.prototype.removeConnection = patchedRemoveConnection
    }

    const originalSetParent = (Blockly as any).BlockSvg?.prototype?.setParent
    if (originalSetParent && !(originalSetParent as any).__patched) {
        const patchedSetParent = function (this: any, newParent: any) {
            try {
                return originalSetParent.call(this, newParent)
            } catch (e: any) {
                scheduleRestore()
                return
            }
        }
        ;(patchedSetParent as any).__patched = true
        ;(Blockly as any).BlockSvg.prototype.setParent = patchedSetParent
    }
}

// Flag globale per definire i blocchi una sola volta
let blocksRegistered = false

function registerKnowageBlocks() {
    if (blocksRegistered) return
    blocksRegistered = true

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
            // Field è un valore (output) da usare nelle formule (anche dentro aggregazioni)
            this.setPreviousStatement(false)
            this.setNextStatement(false)
            this.setColour(160)
        }
    }

    // Field come valore generico (da usare come argomento nelle funzioni).
    // NON lo mettiamo nella toolbox principale per non rendere "separabili" fields/aggregations,
    // ma lo esponiamo solo nella categoria Functions.
    Blockly.Blocks['kn_field_value'] = {
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
            this.setPreviousStatement(false)
            this.setNextStatement(false)
            this.setColour(160)
        }
    }

    Blockly.Blocks['kn_aggregation'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(
                    new Blockly.FieldDropdown(function () {
                        const funcs = (window as any).knBlocklyFunctions || []
                        if (funcs.length === 0) return [['SUM', 'SUM']]
                        const sorted = [...funcs].sort((a: any, b: any) => a.label.localeCompare(b.label))
                        return sorted.map((f: any) => [f.label, f.name])
                    }),
                    'AGGREGATION'
                )
                .appendField('(')
            this.appendValueInput('VALUE').setCheck(null)
            this.appendDummyInput().appendField(')')
            this.setInputsInline(true)
            this.setOutput(true, null)
            this.setColour(230)
        }
    }

    // Blocco unico (non separabile): aggregazione + field nello stesso blocco
    Blockly.Blocks['kn_field_aggregation'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(
                    new Blockly.FieldDropdown(function () {
                        const funcs = (window as any).knBlocklyFunctions || []
                        if (funcs.length === 0) return [['SUM', 'SUM']]
                        const sorted = [...funcs].sort((a: any, b: any) => a.label.localeCompare(b.label))
                        return sorted.map((f: any) => [f.label, f.name])
                    }),
                    'AGGREGATION'
                )
                .appendField('(')
                .appendField(
                    new Blockly.FieldDropdown(function () {
                        const fields = (window as any).knBlocklyFields
                        if (!fields || fields.length === 0) return [['No fields', 'null']]
                        return fields.map((f: any) => [f.fieldLabel || f.fieldAlias, f.fieldAlias])
                    }),
                    'FIELD'
                )
                .appendField(')')
            this.setInputsInline(true)
            this.setOutput(true, null)
            this.setColour(230)
        }
    }

    // Funzione generica con N argomenti (block variadico, layout verticale)
    // Usa propCalcFieldFunctions (esposte in window.knBlocklyFunctions) come sorgente dei nomi
    Blockly.Blocks['kn_function'] = {
        init: function () {
            // DummyInput con dropdown funzione e label numero argomenti
            this.argumentCount_ = 2
            this.appendDummyInput('FUNC_HEADER')
                .appendField(
                    new Blockly.FieldDropdown(function () {
                        const funcs = (window as any).knBlocklyFunctions || []
                        if (funcs.length === 0) return [['SUM', 'SUM']]
                        const sorted = [...funcs].sort((a, b) => a.label.localeCompare(b.label))
                        return sorted.map((f) => [f.label, f.name])
                    }),
                    'FUNC'
                )
                .appendField('n° argomenti:')
                .appendField(
                    new Blockly.FieldNumber(this.argumentCount_, 1, 20, 1, (val) => {
                        // Callback on value change
                        const nVal = Math.max(1, Math.round(Number(val)))
                        if (nVal !== this.argumentCount_) {
                            this.argumentCount_ = nVal
                            this.updateShape_()
                        }
                        return nVal
                    }),
                    'ARG_COUNT_FIELD'
                )
            for (let i = 0; i < this.argumentCount_; i++) {
                this.appendValueInput('ARG' + i).setCheck(null)
            }
            this.setInputsInline(false) // Layout verticale
            this.setOutput(true, null)
            this.setColour(290)
            this.updateShape_()
        },
        mutationToDom: function () {
            const container = document.createElement('mutation')
            container.setAttribute('args', this.argumentCount_)
            return container
        },
        domToMutation: function (xmlElement) {
            this.argumentCount_ = parseInt(xmlElement.getAttribute('args')) || 2
            this.updateShape_()
        },
        updateShape_: function () {
            // Rimuovi tutti gli input argomento
            let i = 0
            while (this.getInput('ARG' + i)) {
                this.removeInput('ARG' + i)
                i++
            }
            // Ricrea gli input
            for (let j = 0; j < this.argumentCount_; j++) {
                this.appendValueInput('ARG' + j).setCheck(null)
            }
            // Aggiorna il FieldNumber del numero di argomenti
            if (this.getField('ARG_COUNT_FIELD')) {
                this.setFieldValue(String(this.argumentCount_), 'ARG_COUNT_FIELD')
            }
        },
        // Aggiungi menu contestuale per aggiungere/rimuovere argomenti
        customContextMenu: function (options) {
            const self = this
            options.push({
                text: '+ Argomento',
                enabled: true,
                callback: function () {
                    self.argumentCount_ = (self.argumentCount_ || 2) + 1
                    self.updateShape_()
                }
            })
            if ((self.argumentCount_ || 2) > 1) {
                options.push({
                    text: '- Argomento',
                    enabled: true,
                    callback: function () {
                        if (self.argumentCount_ > 1) {
                            self.argumentCount_--
                            self.updateShape_()
                        }
                    }
                })
            }
        }
    }

    Blockly.Blocks['kn_variable'] = {
        init: function () {
            const input = this.appendDummyInput().appendField('Var')

            // Dropdown variabile (sempre presente)
            input.appendField(
                new (Blockly as any).FieldDropdown(function () {
                    const vars = (window as any).knBlocklyVariables || []
                    if (!vars || vars.length === 0) return [['No variables', 'null']]
                    // In KnCalculatedField le variabili hanno tipicamente {name, value, pivotedValues?}
                    return vars.map((v: any) => [v.label || v.name, v.name])
                } as any),
                'VAR'
            )

            // Secondo dropdown (KEY) SOLO se ci sono chiavi da selezionare
            const hasSelectableKeys = () => {
                const vars = (window as any).knBlocklyVariables || []
                const selectedVarName = this.getFieldValue('VAR')
                const matched = vars.find((v: any) => v.name === selectedVarName)
                const pivoted = matched?.pivotedValues
                return pivoted && typeof pivoted === 'object' && Object.keys(pivoted).length > 0
            }

            if (hasSelectableKeys()) {
                input.appendField(
                    new (Blockly as any).FieldDropdown(function (this: any) {
                        const vars = (window as any).knBlocklyVariables || []
                        const selectedVarName = this.getSourceBlock?.()?.getFieldValue('VAR')
                        const matched = vars.find((v: any) => v.name === selectedVarName)
                        const pivoted = matched?.pivotedValues
                        if (!pivoted || typeof pivoted !== 'object') return [['', '']]
                        const keys = Object.keys(pivoted)
                        if (keys.length === 0) return [['', '']]
                        return keys.map((k: string) => [k, k])
                    } as any),
                    'KEY'
                )
            } else {
                // Nessuna chiave selezionabile: NON mostrare una select vuota.
                // Manteniamo solo un field nascosto (label vuota) per evitare che Blockly crei UI aggiuntiva.
                try {
                    // In molte versioni Blockly questa label non produce UI interattiva.
                    input.appendField(new (Blockly as any).FieldLabelSerializable(''), 'KEY')
                } catch (e) {
                    // ignore
                }
            }
            this.setOutput(true, null)
            this.setColour(65)
        }
    }

    // NULLIF: esattamente 2 argomenti, non modificabile
    Blockly.Blocks['kn_nullif'] = {
        init: function () {
            this.appendDummyInput().appendField('NULLIF(')
            this.appendValueInput('ARG1').setCheck(null)
            this.appendDummyInput().appendField(',')
            this.appendValueInput('ARG2').setCheck(null)
            this.appendDummyInput().appendField(')')
            this.setInputsInline(true)
            this.setOutput(true, null)
            this.setColour(290)
        }
    }

    // Funzioni matematiche con N argomenti: SUM, AVG, MAX, MIN
    Blockly.Blocks['kn_math_function'] = {
        init: function () {
            this.argumentCount_ = 2
            this.appendDummyInput('FUNC_HEADER')
                .appendField(
                    new Blockly.FieldDropdown([
                        ['SUM', 'SUM'],
                        ['AVG', 'AVG'],
                        ['MAX', 'MAX'],
                        ['MIN', 'MIN']
                    ]),
                    'FUNC'
                )
                .appendField('(')
                .appendField(
                    new Blockly.FieldNumber(this.argumentCount_, 1, 20, 1, function (this: any, val: any) {
                        const block = this.getSourceBlock()
                        if (!block) return val
                        const nVal = Math.max(1, Math.round(Number(val)))
                        if (nVal !== block.argumentCount_) {
                            block.argumentCount_ = nVal
                            block.updateShape_()
                        }
                        return nVal
                    }),
                    'ARG_COUNT'
                )
                .appendField('args )')
            for (let i = 0; i < this.argumentCount_; i++) {
                this.appendValueInput('ARG' + i).setCheck(null)
            }
            this.setInputsInline(false)
            this.setOutput(true, null)
            this.setColour(210)
        },
        mutationToDom: function () {
            const container = document.createElement('mutation')
            container.setAttribute('args', String(this.argumentCount_))
            return container
        },
        domToMutation: function (xmlElement: Element) {
            this.argumentCount_ = parseInt(xmlElement.getAttribute('args') || '2', 10)
            this.updateShape_()
        },
        updateShape_: function () {
            // Rimuovi tutti gli input argomento esistenti
            let i = 0
            while (this.getInput('ARG' + i)) {
                this.removeInput('ARG' + i)
                i++
            }
            // Ricrea gli input
            for (let j = 0; j < this.argumentCount_; j++) {
                this.appendValueInput('ARG' + j).setCheck(null)
            }
            // Aggiorna il FieldNumber
            if (this.getField('ARG_COUNT')) {
                this.setFieldValue(String(this.argumentCount_), 'ARG_COUNT')
            }
        },
        customContextMenu: function (options: any[]) {
            const self = this
            options.push({
                text: '+ Argomento',
                enabled: true,
                callback: function () {
                    self.argumentCount_ = (self.argumentCount_ || 2) + 1
                    self.updateShape_()
                }
            })
            if ((self.argumentCount_ || 2) > 1) {
                options.push({
                    text: '- Argomento',
                    enabled: true,
                    callback: function () {
                        if (self.argumentCount_ > 1) {
                            self.argumentCount_--
                            self.updateShape_()
                        }
                    }
                })
            }
        }
    }
}

// Registra i blocchi subito all'import del modulo
registerKnowageBlocks()

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
            savedFormula: '', // Formula originale salvata (per visualizzazione read-only)
            // `any` per evitare mismatch tra tipi Blockly (WorkspaceSvg) e ciò che ritorna inject in questa build
            workspace: null as any,
            generator: null as any,
            blocklyDivId: 'blocklyDiv_' + Math.random().toString(36).substr(2, 9),
            // listener refs per evitare accumulo (OOM) tra open/close
            changeListenerUpdateLocalState: null as null | ((e: any) => void),
            changeListenerSaveBeforeDrag: null as null | ((e: any) => void)
        }
    },
    validations() {
        if (this.descriptor) {
            return { cf: createValidations('cf', this.descriptor.validations) }
        }
        return { cf: { colName: {} } }
    },
    methods: {
        initBlockly() {
            // Genera un nuovo ID per il div ogni volta
            this.blocklyDivId = 'blocklyDiv_' + Math.random().toString(36).substr(2, 9)

            // RESET
            this.cf = { colName: '', formula: '', xml: '' }
            this.savedFormula = ''

            // MAPPING: Recupero i dati dal template
            if (this.template) {
                const templateAny: any = this.template as any
                if (templateAny?.parameters && Array.isArray(templateAny.parameters)) {
                    const getParam = (name: string) => templateAny.parameters.find((p: any) => p.name === name)?.value || ''
                    this.savedFormula = getParam('formula') // Salvo la formula originale per visualizzazione
                    this.cf.colName = getParam('colName')
                    // Non carico xml nel cf, l'utente parte da zero
                } else {
                    this.cf.colName = templateAny.alias || templateAny.colName || ''
                    this.savedFormula = templateAny.expression || templateAny.formula || '' // Salvo la formula originale
                }
            }

            // Espongo i campi a window
            ;(window as any).knBlocklyFields = this.fields
            ;(window as any).knBlocklyFunctions = this.propCalcFieldFunctions
            ;(window as any).knBlocklyVariables = this.variables

            // Dispose workspace esistente se presente (rimuovo anche i listener)
            this.disposeBlockly()

            this.$nextTick(() => {
                setTimeout(() => {
                    const blocklyDiv = document.getElementById(this.blocklyDivId)
                    if (!blocklyDiv) return

                    const toolbox = {
                        kind: 'categoryToolbox',
                        contents: [
                            // Fields & aggregations devono stare insieme nello stesso blocco/categoria e non essere separabili
                            {
                                kind: 'category',
                                name: 'Fields & aggregations',
                                colour: '160',
                                contents: [
                                    { kind: 'block', type: 'kn_field_aggregation' }
                                    // Nota: niente field isolato, per evitare che field e aggregazione siano separabili
                                ]
                            },
                            {
                                kind: 'category',
                                name: 'Functions',
                                colour: '290',
                                contents: [
                                    { kind: 'block', type: 'kn_nullif' },
                                    { kind: 'block', type: 'kn_math_function' }
                                ]
                            },
                            { kind: 'category', name: 'Variables', colour: '65', contents: [{ kind: 'block', type: 'kn_variable' }] },
                            {
                                kind: 'category',
                                name: 'Math',
                                colour: '230',
                                contents: [
                                    { kind: 'block', type: 'math_number' },
                                    { kind: 'block', type: 'math_arithmetic' }
                                ]
                            }
                        ]
                    }

                    this.workspace = Blockly.inject(this.blocklyDivId, {
                        toolbox: toolbox,
                        readOnly: this.readOnly,
                        trashcan: true,
                        scrollbars: false,
                        move: {
                            scrollbars: false,
                            drag: false,
                            wheel: false
                        },
                        zoom: {
                            controls: false,
                            wheel: false,
                            pinch: false
                        }
                    })

                    // Registra workspace per il recovery globale
                    currentWorkspace = this.workspace

                    this.generator = javascriptGenerator
                    this.setupGeneratorRules()
                    // Inizializza il generator una sola volta dopo l'injection del workspace
                    if (typeof this.generator.init === 'function') {
                        this.generator.init(this.workspace)
                    }
                    // IMPORTANT: se non rimuovi i listener, ad ogni open si accumulano closure e riferimenti al workspace
                    this.changeListenerUpdateLocalState = (e: any) => this.updateLocalState(e)
                    this.workspace.addChangeListener(this.changeListenerUpdateLocalState)

                    // Listener per il recovery: salva stato prima del drag
                    this.changeListenerSaveBeforeDrag = (event: any) => {
                        if (event.type === Blockly.Events.BLOCK_DRAG && event.isStart) {
                            saveGoodState(this.workspace)
                        }
                    }
                    this.workspace.addChangeListener(this.changeListenerSaveBeforeDrag)

                    // Listener globale: salva snapshot prima dei cambiamenti reali; e traccia apertura dropdown
                    this.workspace.addChangeListener((event: any) => {
                        if (!this.workspace || isRestoring) return

                        // UI events: apertura/chiusura menu (dropdown)
                        if (event.type === Blockly.Events.UI) {
                            // In Blockly i menu usano spesso element === 'click'|'selected'|'field'
                            // Qui ci basta capire se un menu è aperto per bloccare scheduleRestore.
                            const element = (event as any).element
                            if (element === 'dropdownOpen') isDropdownOpen = true
                            if (element === 'dropdownClose') isDropdownOpen = false
                            return
                        }

                        // Per qualsiasi change non-UI (creazione blocchi, change field, connessioni, ecc)
                        // salva uno stato buono: così l'eventuale restore ripristina l'ultimo stato coerente,
                        // non quello "prima dell'apertura dialog".
                        saveGoodState(this.workspace)
                    })

                    // NON carichiamo la formula salvata nel workspace - l'utente parte da zero
                    // e può vedere la formula salvata nella sezione read-only sopra
                }, 100)
            })
        },

        setupGeneratorRules() {
            this.generator.forBlock['kn_field'] = (block: any) => {
                const field = block.getFieldValue('FIELD')
                const code = this.source === 'dashboard' ? '"' + field + '"' : '$F{' + field + '}'
                return [code, this.generator.ORDER_ATOMIC]
            }

            this.generator.forBlock['kn_field_value'] = (block: any) => {
                const field = block.getFieldValue('FIELD')
                const code = this.source === 'dashboard' ? '"' + field + '"' : '$F{' + field + '}'
                return [code, this.generator.ORDER_ATOMIC]
            }

            this.generator.forBlock['kn_variable'] = (block: any) => {
                const varName = block.getFieldValue('VAR')
                const key = block.getField ? block.getFieldValue('KEY') : ''
                const code = key ? `$V{${varName}.${key}}` : `$V{${varName}}`
                return [code, this.generator.ORDER_ATOMIC]
            }

            this.generator.forBlock['kn_aggregation'] = (block: any) => {
                const funcName = block.getFieldValue('AGGREGATION')
                const value = this.generator.valueToCode(block, 'VALUE', this.generator.ORDER_NONE) || '0'

                const funcs = (window as any).knBlocklyFunctions || []
                const funcDef = funcs.find((f: any) => f.name === funcName)

                let realFuncName = funcName
                if (funcDef && funcDef.formula) {
                    const extracted = funcDef.formula.split('(')[0].trim()
                    if (extracted) realFuncName = extracted
                }

                let code = `${realFuncName}(${value})`
                if (funcDef) {
                    if (funcName === 'COUNT_DISTINCT') code = `COUNT(DISTINCT ${value})`
                    else if (funcName === 'COUNT') code = `COUNT(${value})`
                }
                return [code, this.generator.ORDER_FUNCTION_CALL]
            }

            this.generator.forBlock['kn_field_aggregation'] = (block: any) => {
                const funcName = block.getFieldValue('AGGREGATION')
                const field = block.getFieldValue('FIELD')

                // Riusa la logica di kn_aggregation per tradurre nomi/COUNT speciali
                const funcs = (window as any).knBlocklyFunctions || []
                const funcDef = funcs.find((f: any) => f.name === funcName)

                let realFuncName = funcName
                if (funcDef && funcDef.formula) {
                    const extracted = funcDef.formula.split('(')[0].trim()
                    if (extracted) realFuncName = extracted
                }

                const value = this.source === 'dashboard' ? '"' + field + '"' : '$F{' + field + '}'

                let code = `${realFuncName}(${value})`
                if (funcDef) {
                    if (funcName === 'COUNT_DISTINCT') code = `COUNT(DISTINCT ${value})`
                    else if (funcName === 'COUNT') code = `COUNT(${value})`
                }
                return [code, this.generator.ORDER_FUNCTION_CALL]
            }

            this.generator.forBlock['kn_function'] = (block: any) => {
                const funcName = block.getFieldValue('FUNC')
                const funcs = (window as any).knBlocklyFunctions || []
                const funcDef = funcs.find((f: any) => f.name === funcName)
                let realFuncName = funcName
                if (funcDef && funcDef.formula) {
                    const extracted = funcDef.formula.split('(')[0].trim()
                    if (extracted) realFuncName = extracted
                }
                // Recupera tutti gli argomenti
                const args: string[] = []
                const argCount = block.argumentCount_ || 2
                for (let i = 0; i < argCount; i++) {
                    const a = this.generator.valueToCode(block, 'ARG' + i, this.generator.ORDER_NONE)
                    if (a && a.trim()) args.push(a)
                }
                const code = `${realFuncName}(${args.join(', ')})`
                return [code, this.generator.ORDER_FUNCTION_CALL]
            }

            // Generator per NULLIF (2 argomenti fissi)
            this.generator.forBlock['kn_nullif'] = (block: any) => {
                const arg1 = this.generator.valueToCode(block, 'ARG1', this.generator.ORDER_NONE) || '0'
                const arg2 = this.generator.valueToCode(block, 'ARG2', this.generator.ORDER_NONE) || '0'
                const code = `NULLIF(${arg1}, ${arg2})`
                return [code, this.generator.ORDER_FUNCTION_CALL]
            }

            // Generator per kn_math_function (SUM, AVG, MAX, MIN con N argomenti)
            this.generator.forBlock['kn_math_function'] = (block: any) => {
                const funcName = block.getFieldValue('FUNC')
                const args: string[] = []
                const argCount = block.argumentCount_ || 2
                for (let i = 0; i < argCount; i++) {
                    const a = this.generator.valueToCode(block, 'ARG' + i, this.generator.ORDER_NONE)
                    if (a && a.trim()) args.push(a)
                }
                const code = `${funcName}(${args.join(', ')})`
                return [code, this.generator.ORDER_FUNCTION_CALL]
            }
        },

        loadState() {
            if (!this.workspace) return

            // PULIZIA
            this.workspace.clear()

            // CASO 1: Ho l'XML salvato
            if (this.cf.xml && this.cf.xml.trim().startsWith('<xml')) {
                try {
                    const dom = Blockly.utils.xml.textToDom(this.cf.xml)
                    Blockly.Xml.domToWorkspace(dom, this.workspace)
                    return
                } catch (e) {
                    console.error('Errore caricamento XML, fallback su parser formula', e)
                    this.workspace.clear()
                }
            }

            // CASO 2: Provo a parsare la formula (retrocompatibilità)
            if (this.cf.formula) {
                this.loadFromFormula(this.cf.formula)
            }
        },

        updateLocalState(event: any) {
            if (event.type === Blockly.Events.UI || !this.workspace || this.workspace.isDragging()) return

            // Aggiorno solo la stringa formula per visualizzazione, l'XML lo genero al salvataggio finale
            const topBlocks = this.workspace.getTopBlocks(false)
            if (topBlocks.length > 0) {
                const codeTuple = this.generator.blockToCode(topBlocks[0])
                this.cf.formula = Array.isArray(codeTuple) ? codeTuple[0] : codeTuple || ''
            } else {
                this.cf.formula = ''
            }
        },

        loadFromFormula(formula: string) {
            // IL TUO VECCHIO PARSER REINSERITO PER FALLBACK
            const recursiveGenerateXML = (expr: string): string => {
                expr = expr.trim()

                const countDistinctMatch = expr.match(/^COUNT\s*\(\s*DISTINCT\s+(.*)\)$/i)
                if (countDistinctMatch) {
                    // Prova a trasformare COUNT(DISTINCT field) nel blocco unico non separabile
                    const inner = countDistinctMatch[1].trim()
                    const quoteMatchInner = inner.match(/^"(.*)"$/)
                    if (quoteMatchInner) {
                        const name = quoteMatchInner[1]
                        const field = this.fields.find((f: any) => f.fieldAlias === name || f.fieldLabel === name)
                        if (field) return `<block type="kn_field_aggregation"><field name="AGGREGATION">COUNT_DISTINCT</field><field name="FIELD">${field.fieldAlias}</field></block>`
                    }
                    return `<block type="kn_aggregation"><field name="AGGREGATION">COUNT_DISTINCT</field><value name="VALUE">${recursiveGenerateXML(inner)}</value></block>`
                }

                const funcMatch = expr.match(/^([a-zA-Z0-9_]+)\s*\((.*)\)$/)
                if (funcMatch) {
                    const funcName = funcMatch[1].toUpperCase()
                    const content = funcMatch[2]
                    const funcs = (window as any).knBlocklyFunctions || []
                    const funcDef = funcs.find((f: any) => f.name === funcName)
                    if (funcDef) {
                        // Se il contenuto è un field semplice, usa il blocco unico
                        const inner = content.trim()
                        const qm = inner.match(/^"(.*)"$/)
                        if (qm) {
                            const name = qm[1]
                            const field = this.fields.find((f: any) => f.fieldAlias === name || f.fieldLabel === name)
                            if (field) return `<block type="kn_field_aggregation"><field name="AGGREGATION">${funcName}</field><field name="FIELD">${field.fieldAlias}</field></block>`
                        }
                        return `<block type="kn_aggregation"><field name="AGGREGATION">${funcName}</field><value name="VALUE">${recursiveGenerateXML(content)}</value></block>`
                    }
                }

                const quoteMatch = expr.match(/^"(.*)"$/)
                if (quoteMatch) {
                    const name = quoteMatch[1]
                    const field = this.fields.find((f: any) => f.fieldAlias === name || f.fieldLabel === name)
                    if (field) return `<block type="kn_field_value"><field name="FIELD">${field.fieldAlias}</field></block>`
                }

                const varMatch2 = expr.match(/^\$V\{([a-zA-Z0-9\_\-\s]+)\.?([a-zA-Z0-9\_\-\s]*)\}$/)
                if (varMatch2) {
                    const name = varMatch2[1]
                    const key = varMatch2[2] || ''
                    return `<block type="kn_variable"><field name="VAR">${name}</field><field name="KEY">${key}</field></block>`
                }

                const varMatch = expr.match(/^\$F\{(.*)\}$/)
                if (varMatch) {
                    const name = varMatch[1]
                    const field = this.fields.find((f: any) => f.fieldAlias === name || f.fieldLabel === name)
                    const alias = field ? field.fieldAlias : name
                    return `<block type="kn_field_value"><field name="FIELD">${alias}</field></block>`
                }

                if (!isNaN(parseFloat(expr)) && isFinite(expr as any)) {
                    return `<block type="math_number"><field name="NUM">${expr}</field></block>`
                }

                // Fallback generico campo
                const field = this.fields.find((f: any) => f.fieldAlias === expr || f.fieldLabel === expr)
                if (field) return `<block type="kn_field_value"><field name="FIELD">${field.fieldAlias}</field></block>`

                return ''
            }

            const xmlString = `<xml xmlns="https://developers.google.com/blockly/xml">${recursiveGenerateXML(formula)}</xml>`
            try {
                if (this.workspace) {
                    const dom = Blockly.utils.xml.textToDom(xmlString)
                    Blockly.Xml.domToWorkspace(dom, this.workspace)
                }
            } catch (e) {
                console.warn('Parse fail', e)
            }
        },

        disposeBlockly() {
            // Pulisci riferimenti globali
            if (currentWorkspace === this.workspace) {
                currentWorkspace = null
                lastGoodState = null
                isRestoring = false
                restoreScheduled = false
            }

            if (this.workspace) {
                // Rimuovi i listener per evitare leak
                try {
                    if (this.changeListenerUpdateLocalState) {
                        this.workspace.removeChangeListener(this.changeListenerUpdateLocalState)
                    }
                    if (this.changeListenerSaveBeforeDrag) {
                        this.workspace.removeChangeListener(this.changeListenerSaveBeforeDrag)
                    }
                } catch (e) {
                    // ignore
                }
                this.workspace.dispose()
                this.workspace = null
            }

            this.changeListenerUpdateLocalState = null
            this.changeListenerSaveBeforeDrag = null
        },

        apply() {
            if (this.workspace) {
                // 1. Genera XML
                const dom = Blockly.Xml.workspaceToDom(this.workspace)
                this.cf.xml = Blockly.Xml.domToText(dom)

                // 2. Genera Formula (Codice)
                const topBlocks = this.workspace.getTopBlocks(false)
                if (topBlocks.length > 0) {
                    const codeTuple = this.generator.blockToCode(topBlocks[0])
                    this.cf.formula = Array.isArray(codeTuple) ? codeTuple[0] : codeTuple || ''
                } else {
                    this.cf.formula = ''
                }
            }

            // Emetti copia profonda
            this.$emit('save', JSON.parse(JSON.stringify(this.cf)))
        },

        cancel() {
            this.$emit('update:readOnly', false)
            this.$emit('cancel')
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

/* Sezione formula salvata (read-only) */
.saved-formula-section {
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    padding: 1rem;
}

.saved-formula-section .section-header {
    color: #6c757d;
    font-weight: 600;
}

.saved-formula-section .section-title {
    font-size: 0.9rem;
    text-transform: uppercase;
}

.saved-formula-display {
    background-color: #fff;
    border: 1px dashed #adb5bd;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.95rem;
    color: #495057;
    word-break: break-all;
}

/* Sezione nuova formula */
.new-formula-section .section-header {
    color: #495057;
    font-weight: 600;
}

.new-formula-section .section-title {
    font-size: 0.9rem;
    text-transform: uppercase;
}

/* Preview della formula generata */
.formula-preview {
    background-color: #e8f5e9;
    border: 1px solid #a5d6a7;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.9rem;
}

.formula-preview code {
    color: #2e7d32;
    word-break: break-all;
}
</style>

<style>
/* Z-index fix per i dropdown di Blockly dentro i modali PrimeVue */
.blocklyDropDownDiv,
.blocklyWidgetDiv,
.blocklyTooltipDiv {
    z-index: 20000 !important;
}
</style>
