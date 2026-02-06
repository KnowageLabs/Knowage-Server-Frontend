<template>
    <Dialog
        class="kn-dialog--toolbar--primary calculatedFieldDialogClass"
        :visible="visibility"
        :header="$t('components.knCalculatedField.title') + ' (Blockly)'"
        :closable="false"
        modal
        :breakpoints="{ '960px': '75vw', '640px': '100vw' }"
        @show="initBlockly"
        @hide="disposeBlockly"
    >
        <Message severity="info" :closable="false">{{ $t('components.knCalculatedField.description') }}</Message>

        <div class="p-fluid p-grid">
            <div class="p-col">
                <span class="p-float-label p-field kn-flex">
                    <InputText
                        id="colName"
                        v-model="v$.cf.colName.$model"
                        type="text"
                        :disabled="readOnly"
                        class="kn-material-input"
                        :class="{ 'p-invalid': v$.cf.colName.$invalid }"
                        @blur="v$.cf.colName.$touch()"
                    />
                    <label class="kn-material-input-label"> {{ $t('components.knCalculatedField.columnName') }} </label>
                </span>
            </div>
        </div>

        <div class="p-grid p-m-0" style="height: 500px; border: 1px solid #ccc; position: relative">
            <div :id="blocklyDivId" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0"></div>
        </div>

        <template #footer>
            <Button
                :class="readOnly ? 'kn-button kn-button--primary' : 'kn-button kn-button--secondary'"
                :label="$t('common.cancel')"
                @click="cancel"
            />
            <Button
                v-if="!readOnly"
                :label="$t('common.apply')"
                class="kn-button kn-button--primary"
                :disabled="v$.$invalid"
                @click="apply"
            />
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
let patchesApplied = false;
let lastGoodState: string | null = null;
let isRestoring = false;
let currentWorkspace: any = null;
let restoreScheduled = false;

// Funzione per salvare lo stato corrente
function saveGoodState(workspace: any) {
    if (!workspace || isRestoring) return;
    try {
        const dom = Blockly.Xml.workspaceToDom(workspace);
        lastGoodState = Blockly.Xml.domToText(dom);
    } catch (e) {
        // Ignora errori di salvataggio
    }
}

// Funzione per ripristinare lo stato (con debounce)
function scheduleRestore() {
    if (restoreScheduled || isRestoring || !currentWorkspace || !lastGoodState) return;
    if (currentWorkspace.isDragging && currentWorkspace.isDragging()) return;

    restoreScheduled = true;

    setTimeout(() => {
        restoreScheduled = false;
        if (!currentWorkspace || !lastGoodState || isRestoring) return;
        if (currentWorkspace.isDragging && currentWorkspace.isDragging()) return;

        isRestoring = true;
        try {
            currentWorkspace.clear();
            const dom = Blockly.utils.xml.textToDom(lastGoodState);
            Blockly.Xml.domToWorkspace(dom, currentWorkspace);
        } catch (e) {
            console.warn('[KnBlockly] Errore durante restore:', e);
        } finally {
            setTimeout(() => { isRestoring = false; }, 300);
        }
    }, 300);
}

if (!patchesApplied) {
    patchesApplied = true;

    // Patch per disabilitare bumpNeighbours che causa lo spostamento dei blocchi
    const originalBumpNeighbours = (Blockly as any).BlockSvg?.prototype?.bumpNeighbours;
    if (originalBumpNeighbours && !(originalBumpNeighbours as any).__patched) {
        (Blockly as any).BlockSvg.prototype.bumpNeighbours = function() {
            return;
        };
        ((Blockly as any).BlockSvg.prototype.bumpNeighbours as any).__patched = true;
    }

    // Patch per ignorare gli errori di Blockly e schedulare il restore
    const originalRemoveConnection = (Blockly as any).ConnectionDB?.prototype?.removeConnection;
    if (originalRemoveConnection && !(originalRemoveConnection as any).__patched) {
        const patchedRemoveConnection = function(this: any, connection: any, yPos: number) {
            try {
                return originalRemoveConnection.call(this, connection, yPos);
            } catch (e: any) {
                scheduleRestore();
                return;
            }
        };
        (patchedRemoveConnection as any).__patched = true;
        (Blockly as any).ConnectionDB.prototype.removeConnection = patchedRemoveConnection;
    }

    const originalSetParent = (Blockly as any).BlockSvg?.prototype?.setParent;
    if (originalSetParent && !(originalSetParent as any).__patched) {
        const patchedSetParent = function(this: any, newParent: any) {
            try {
                return originalSetParent.call(this, newParent);
            } catch (e: any) {
                scheduleRestore();
                return;
            }
        };
        (patchedSetParent as any).__patched = true;
        (Blockly as any).BlockSvg.prototype.setParent = patchedSetParent;
    }
}

// Flag globale per definire i blocchi una sola volta
let blocksRegistered = false;

function registerKnowageBlocks() {
    if (blocksRegistered) return;
    blocksRegistered = true;

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
            this.appendValueInput('VALUE')
                .setCheck(null)
            this.appendDummyInput()
                .appendField(')')
            this.setInputsInline(true)
            this.setOutput(true, null)
            this.setColour(230)
        }
    }
}

// Registra i blocchi subito all'import del modulo
registerKnowageBlocks();

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
            generator: null as any,
            blocklyDivId: 'blocklyDiv_' + Math.random().toString(36).substr(2, 9)
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
            this.blocklyDivId = 'blocklyDiv_' + Math.random().toString(36).substr(2, 9);

            // RESET
            this.cf = { colName: '', formula: '', xml: '' }

            // MAPPING: Recupero i dati dal template
            if (!this.readOnly && this.template) {
                if (this.template.parameters && Array.isArray(this.template.parameters)) {
                    const getParam = (name: string) => this.template.parameters.find((p: any) => p.name === name)?.value || '';
                    this.cf.formula = getParam('formula');
                    this.cf.colName = getParam('colName');
                    this.cf.xml = getParam('xml');
                } else {
                    this.cf.colName = this.template.alias || this.template.colName || '';
                    this.cf.formula = this.template.expression || this.template.formula || '';
                    this.cf.xml = this.template.blocklyXml || '';
                }
            }

            // Espongo i campi a window
            ;(window as any).knBlocklyFields = this.fields
            ;(window as any).knBlocklyFunctions = this.propCalcFieldFunctions

            // Dispose workspace esistente se presente
            if (this.workspace) {
                this.workspace.dispose();
                this.workspace = null;
            }

            this.$nextTick(() => {
                setTimeout(() => {
                    const blocklyDiv = document.getElementById(this.blocklyDivId)
                    if (!blocklyDiv) return;

                    const toolbox = {
                        kind: 'categoryToolbox',
                        contents: [
                            { kind: 'category', name: 'Fields', colour: '160', contents: [{ kind: 'block', type: 'kn_field' }] },
                            { kind: 'category', name: 'Aggregations', colour: '230', contents: [{ kind: 'block', type: 'kn_aggregation' }] },
                            { kind: 'category', name: 'Math', colour: '230', contents: [{ kind: 'block', type: 'math_number' }, { kind: 'block', type: 'math_arithmetic' }] }
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
                    currentWorkspace = this.workspace;

                    this.generator = javascriptGenerator
                    this.setupGeneratorRules();
                    this.workspace.addChangeListener(this.updateLocalState);

                    // Listener per il recovery: salva stato prima del drag
                    this.workspace.addChangeListener((event: any) => {
                        if (event.type === Blockly.Events.BLOCK_DRAG && event.isStart) {
                            saveGoodState(this.workspace);
                        }
                    });

                    this.loadState();

                }, 100)
            });
        },


        setupGeneratorRules() {
            this.generator.forBlock['kn_field'] = (block: any) => {
                const field = block.getFieldValue('FIELD')
                const code = this.source === 'dashboard' ? '"' + field + '"' : '$F{' + field + '}'
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
        },

        loadState() {
            if (!this.workspace) return;

            // PULIZIA
            this.workspace.clear();

            // CASO 1: Ho l'XML salvato
            if (this.cf.xml && this.cf.xml.trim().startsWith('<xml')) {
                try {
                    const dom = Blockly.utils.xml.textToDom(this.cf.xml);
                    Blockly.Xml.domToWorkspace(dom, this.workspace);
                    return;
                } catch (e) {
                    console.error('Errore caricamento XML, fallback su parser formula', e);
                    this.workspace.clear();
                }
            }

            // CASO 2: Provo a parsare la formula (retrocompatibilità)
            if (this.cf.formula) {
                this.loadFromFormula(this.cf.formula);
            }
        },


        updateLocalState(event: any) {
            if (event.type === Blockly.Events.UI || !this.workspace || this.workspace.isDragging()) return;

            // Aggiorno solo la stringa formula per visualizzazione, l'XML lo genero al salvataggio finale
            const topBlocks = this.workspace.getTopBlocks(false)
            if (topBlocks.length > 0) {
                const codeTuple = this.generator.blockToCode(topBlocks[0])
                this.cf.formula = Array.isArray(codeTuple) ? codeTuple[0] : (codeTuple || '')
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
                    return `<block type="kn_aggregation"><field name="AGGREGATION">COUNT_DISTINCT</field><value name="VALUE">${recursiveGenerateXML(countDistinctMatch[1])}</value></block>`
                }

                const funcMatch = expr.match(/^([a-zA-Z0-9_]+)\s*\((.*)\)$/)
                if (funcMatch) {
                    const funcName = funcMatch[1].toUpperCase()
                    const content = funcMatch[2]
                    const funcs = (window as any).knBlocklyFunctions || []
                    const funcDef = funcs.find((f: any) => f.name === funcName)
                    if (funcDef) {
                        return `<block type="kn_aggregation"><field name="AGGREGATION">${funcName}</field><value name="VALUE">${recursiveGenerateXML(content)}</value></block>`
                    }
                }

                const quoteMatch = expr.match(/^"(.*)"$/)
                if (quoteMatch) {
                    const name = quoteMatch[1]
                    const field = this.fields.find((f: any) => f.fieldAlias === name || f.fieldLabel === name)
                    if (field) return `<block type="kn_field"><field name="FIELD">${field.fieldAlias}</field></block>`
                }

                const varMatch = expr.match(/^\$F\{(.*)\}$/)
                if (varMatch) {
                    const name = varMatch[1]
                    const field = this.fields.find((f: any) => f.fieldAlias === name || f.fieldLabel === name)
                    const alias = field ? field.fieldAlias : name;
                    return `<block type="kn_field"><field name="FIELD">${alias}</field></block>`
                }

                if (!isNaN(parseFloat(expr)) && isFinite(expr as any)) {
                    return `<block type="math_number"><field name="NUM">${expr}</field></block>`
                }

                // Fallback generico campo
                const field = this.fields.find((f: any) => f.fieldAlias === expr || f.fieldLabel === expr)
                if (field) return `<block type="kn_field"><field name="FIELD">${field.fieldAlias}</field></block>`

                return ''
            }

            const xmlString = `<xml xmlns="https://developers.google.com/blockly/xml">${recursiveGenerateXML(formula)}</xml>`
            try {
                if (this.workspace) {
                    const dom = Blockly.utils.xml.textToDom(xmlString);
                    Blockly.Xml.domToWorkspace(dom, this.workspace);
                }
            } catch (e) {
                console.warn('Parse fail', e)
            }
        },

        disposeBlockly() {
            // Pulisci riferimenti globali
            if (currentWorkspace === this.workspace) {
                currentWorkspace = null;
                lastGoodState = null;
                isRestoring = false;
                restoreScheduled = false;
            }

            if (this.workspace) {
                this.workspace.dispose()
                this.workspace = null
            }
        },

        apply() {
            if (this.workspace) {
                // 1. Genera XML
                const dom = Blockly.Xml.workspaceToDom(this.workspace);
                this.cf.xml = Blockly.Xml.domToText(dom);

                // 2. Genera Formula (Codice)
                const topBlocks = this.workspace.getTopBlocks(false);
                if (topBlocks.length > 0) {
                    const codeTuple = this.generator.blockToCode(topBlocks[0]);
                    this.cf.formula = Array.isArray(codeTuple) ? codeTuple[0] : (codeTuple || '');
                } else {
                    this.cf.formula = '';
                }
            }


            // Emetti copia profonda
            this.$emit('save', JSON.parse(JSON.stringify(this.cf)));
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
</style>

<style>
/* Z-index fix per i dropdown di Blockly dentro i modali PrimeVue */
.blocklyDropDownDiv,
.blocklyWidgetDiv,
.blocklyTooltipDiv {
    z-index: 20000 !important;
}
</style>
