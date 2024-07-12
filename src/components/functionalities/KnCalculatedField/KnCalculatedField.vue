<template>
    <Dialog class="kn-dialog--toolbar--primary calculatedFieldDialogClass" :visible="visibility" :header="$t('components.knCalculatedField.title')" :closable="false" modal :breakpoints="{ '960px': '75vw', '640px': '100vw' }">
        <Message severity="info" :closable="false">{{ $t('components.knCalculatedField.description') }}</Message>

        <div class="p-fluid p-grid">
            <div class="p-col">
                <span class="p-float-label p-field kn-flex">
                    <InputText
                        id="colName"
                        ref="colName"
                        v-model="v$.cf.colName.$model"
                        type="text"
                        :disabled="readOnly"
                        class="kn-material-input"
                        :class="{
                            'p-invalid': v$.cf.colName.$invalid
                        }"
                        @blur="v$.cf.colName.$touch()"
                    />
                    <label class="kn-material-input-label"> {{ $t('components.knCalculatedField.columnName') }} </label>
                </span>
            </div>
            <slot name="additionalInputs"> </slot>
        </div>

        <Card class="card-0-padding">
            <template #content>
                <div class="p-fluid p-grid">
                    <div class="p-col-4">
                        <h5 class="p-float-label p-text-uppercase p-m-2">{{ $t('components.knCalculatedField.fields') }}</h5>

                        <ScrollPanel class="kn-list knListBox kn-flex kn-list-no-border-right" style="height: 200px !important; border: 1px">
                            <Message v-if="fields?.length == 0" severity="warn" :closable="false">
                                {{ $t('components.knCalculatedField.noAvailableFields') }}
                            </Message>
                            <div v-for="(field, index) in fields" v-else :key="index" v-tooltip.bottom="source === 'QBE' ? field.fieldLabel : field.fieldAlias" class="kn-list-item p-d-flex p-ai-center fieldType kn-truncated p-ml-2" draggable="true" @dragstart="dragElement($event, field, 'field')">
                                <div><i class="fa fa-solid fa-bars"></i></div>
                                <div v-if="source === 'QBE'" class="p-ml-2">{{ field.fieldLabel }}</div>
                                <div v-else class="p-ml-2">{{ field.fieldAlias }}</div>
                            </div>
                        </ScrollPanel>
                    </div>
                    <div class="p-col-4">
                        <span class="p-float-label p-m-2">
                            <Dropdown id="category" v-model="selectedCategory" :options="availableCategories" class="kn-material-input" option-label="name" option-value="code" @change="filterFunctions" />
                            <label for="category" class="kn-material-input-label"> {{ $t(descriptor.category.label) }} </label>
                        </span>

                        <h5 class="p-float-label p-text-uppercase p-m-2">{{ $t('components.knCalculatedField.functions') }}</h5>
                        <ScrollPanel class="kn-list knListBox kn-flex kn-list-no-border-right" style="height: 150px !important; border: 1px">
                            <div
                                v-for="(af, index) in availableFunctions"
                                :key="index"
                                v-tooltip.bottom="af.formula"
                                class="kn-list-item p-d-flex p-ai-center formulaType kn-truncated p-ml-2"
                                :class="{ selected: af.formula === selectedFunction.formula }"
                                draggable="true"
                                @dragstart="dragElement($event, af, 'function')"
                                @click="handleClick(af)"
                            >
                                <div><i class="fa fa-solid fa-bars"></i></div>
                                <div class="p-ml-2">{{ af.formula }}</div>
                            </div>
                        </ScrollPanel>
                    </div>
                    <div class="p-col-4">
                        <span v-if="showHelpPanel" class="kn-flex p-d-flex p-flex-column p-jc-between helpCol p-m-2">
                            <h5 class="p-float-label p-text-uppercase p-m-2">
                                {{ selectedFunction.label }}
                            </h5>

                            <ScrollPanel class="helpScrollPanel custombar1"> <div v-html="$t(selectedFunction.help)"></div></ScrollPanel>

                            <div v-if="selectedFunction.officialDocumentationLink" class="helpClass">
                                <a :href="selectedFunction.officialDocumentationLink" target="_blank"> {{ $t('components.knCalculatedField.officialDocumentation', { function: selectedFunction.label }) }}</a>
                            </div>
                        </span>
                        <span v-else class="p-m-2">
                            <KnHint class="kn-hint-sm" :title="'components.knCalculatedField.title'" :hint="$t(descriptor.hint)" data-test="hint"></KnHint>
                        </span>
                    </div>
                </div>
            </template>
        </Card>

        <Message v-if="isWarningVisible()" severity="warn" :closable="false">{{ $t('components.knCalculatedField.nullifWarning', { nullIfFunction: nullIfFunction }) }}</Message>
        <knMonaco
            ref="editor"
            v-model="v$.cf.formula.$model"
            class="p-mt-1"
            :class="{ 'p-invalid': v$.cf.formula.$invalid, dragging: dragging }"
            style="height: 200px"
            language="cfLang"
            :options="{ wordWrap: 'on', readOnly: readOnly }"
            @editor-setup="editorSetup"
            @drop="drop(this, $event)"
        ></knMonaco>

        <template #footer>
            <Button :class="readOnly ? 'kn-button kn-button--primary' : 'kn-button kn-button--secondary'" :label="$t('common.cancel')" @click="cancel" />
            <Button v-if="!readOnly" :label="isValidating ? $t('common.validation.validating') : $t('common.apply')" :icon="{ 'pi pi-spin pi-spinner': isValidating }" class="kn-button kn-button--primary" :disabled="saveButtonDisabled" @click="apply" />
        </template>
    </Dialog>
</template>

<script lang="ts">
import { PropType, defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import { createValidations } from '@/helpers/commons/validationHelper'
import { IKnCalculatedField, IKnCalculatedFieldFunction } from '@/components/functionalities/KnCalculatedField/KnCalculatedField'
import knMonaco from '@/components/UI/KnMonaco/knMonaco.vue'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import KnHint from '@/components/UI/KnHint.vue'
import Message from 'primevue/message'
import ScrollPanel from 'primevue/scrollpanel'
import useValidate from '@vuelidate/core'
import { mapActions } from 'pinia'
import mainStore from '@/App.store'

let editor = null
export default defineComponent({
    name: 'calculated-field',
    components: { Dialog, Dropdown, KnHint, knMonaco, Message, ScrollPanel },
    props: {
        fields: Array,
        variables: Array,
        visibility: Boolean,
        readOnly: Boolean,
        descriptor: Object,
        template: {} as any,
        validation: Boolean,
        valid: Boolean,
        source: String,
        propCalcFieldFunctions: { type: Array as PropType<IKnCalculatedFieldFunction[]>, required: true },
        propNullifFunction: { type: Object, required: false }
    },
    emits: ['save', 'cancel', 'update:readOnly'],
    data() {
        return {
            cf: { formula: '' } as IKnCalculatedField,
            allCategories: { name: 'ALL', code: 'ALL' },
            selectedFunction: {},
            selectedCategory: '',
            availableCategories: [] as any,
            availableFunctions: [] as any,
            monaco: {} as any,
            monacoEditor: {} as any,
            v$: useValidate() as any,
            formulaValidationInterval: {} as any,
            isValidFormula: false,
            calcFieldFunctions: [] as IKnCalculatedFieldFunction[],
            showHelpPanel: false,
            isValidating: false,
            dragging: false
        }
    },
    computed: {
        saveButtonDisabled(): any {
            if (typeof this.valid === 'undefined') return this.v$.$invalid || !this.isValidFormula
            else return this.v$.$invalid || !this.isValidFormula || !this.valid
        }
    },
    watch: {
        selectedFunction(newValue, oldValue) {
            if (newValue && oldValue !== newValue && newValue.label) {
                this.showHelpPanel = true
            } else {
                this.showHelpPanel = false
            }
        },
        readOnly(value) {
            this.scriptOptions.readOnly = value
        },
        visibility(newV, oldV) {
            if (newV && newV !== oldV) {
                if (!this.selectedCategory) {
                    if (this.descriptor?.defaultSelectedCategory) this.selectedCategory = this.descriptor?.defaultSelectedCategory
                    else this.selectedCategory = this.allCategories.name
                }
            }
        },
        'cf.formula'(newFormula, oldFormula) {
            if (newFormula != oldFormula && this.cf.formula) {
                if (this.validation) {
                    this.isValidating = true
                    this.isValidFormula = false
                    if (this.formulaValidationInterval) clearInterval(this.formulaValidationInterval)
                    const tempFormula = this.cf.formula.replace(/\$V{([a-zA-Z0-9\_\-\s]+)\.?([a-zA-Z0-9\_\-\s]*)}/g, (match, variable, key) => {
                        if (this.variables) {
                            const matchedVariable = this.variables.filter((item) => item.name === variable)[0]
                            if (matchedVariable && matchedVariable.pivotedValues) {
                                return matchedVariable.pivotedValues[key]
                            } else return matchedVariable.value
                        } else return variable
                    })
                    this.formulaValidationInterval = setInterval(() => {
                        this.$http
                            .post(
                                import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/datasets/validateFormula',
                                {
                                    formula: tempFormula,
                                    measuresList: this.fields?.map((field) => {
                                        return { name: field.fieldLabel, alias: field.fieldAlias }
                                    })
                                },
                                { headers: { 'X-Disable-Errors': 'true' } }
                            )
                            .then((response: AxiosResponse<any>) => {
                                this.isValidFormula = response.data.msg ? true : false
                            })
                            .catch(() => {
                                this.setError({
                                    title: this.$t('common.toast.errorTitle'),
                                    msg: this.$t('common.error.validation', { what: 'formula ' })
                                })
                            })
                            .finally(() => (this.isValidating = false))
                        clearInterval(this.formulaValidationInterval)
                        this.formulaValidationInterval = null
                    }, 1500)
                } else {
                    this.isValidFormula = true
                }
            }
        }
    },
    created() {
        this.calcFieldFunctions = [...this.propCalcFieldFunctions]
        this.availableFunctions = [...this.calcFieldFunctions].sort((a, b) => {
            return a.name.localeCompare(b.name)
        })
        this.availableFunctions.forEach((x) => {
            x.category = x.category.toUpperCase()
        })
        this.cf = { formula: '' } as IKnCalculatedField
        if (!this.readOnly && this.template && !this.template.parameters && this.source === 'QBE') {
            this.cf = { colName: this.template.alias, formula: this.template.expression } as IKnCalculatedField
        }
        if (!this.readOnly && this.template && !this.template.parameters && this.source === 'dashboard') {
            this.cf = { colName: this.template.alias, formula: this.template.formula } as IKnCalculatedField
        }
        this.handleCategories()
    },
    updated() {
        if (!this.cf.formula) this.cf.formula = ''
        if (this.readOnly && this.template && this.template.parameters) {
            this.cf = {} as IKnCalculatedField
            for (let i = 0; i < this.template.parameters.length; i++) {
                if (this.template.parameters[i]['name'] == 'formula') this.cf.formula = this.template.parameters[i]['value']
                else if (this.template.parameters[i]['name'] == 'colName') this.cf.colName = this.template.parameters[i]['value']
            }
        }
        if (!this.readOnly && this.template && !this.template.parameters && this.source === 'QBE') {
            this.cf = { colName: this.template.alias, formula: this.template.expression } as IKnCalculatedField
        }
        if (!this.readOnly && this.template && !this.template.parameters && this.source === 'dashboard') {
            this.cf = { colName: this.template.alias, formula: this.template.formula } as IKnCalculatedField
        }
    },
    validations() {
        if (this.descriptor) {
            return { cf: createValidations('cf', this.descriptor.validations) }
        }
        return {}
    },
    methods: {
        ...mapActions(mainStore, ['setError']),
        editorSetup(monacoInstance) {
            //this.monacoEditor = monaco.editor
            this.monaco = monacoInstance.monaco
            editor = monacoInstance.editor
        },
        isWarningVisible() {
            return this.propNullifFunction && this.cf.formula && this.cf.formula != '' && this.cf.formula?.match('/')
        },
        handleClick(af) {
            if (JSON.stringify(this.selectedFunction) === JSON.stringify(af)) {
                this.selectedFunction = {}
            } else {
                this.selectedFunction = af
            }
        },
        apply(): void {
            this.$emit('save', this.cf)
            this.clearForm()
        },
        cancel(): void {
            this.$emit('update:readOnly', false)
            this.$emit('cancel', this.cf)
            this.clearForm()
        },
        clearForm(): void {
            this.cf = { formula: '' } as IKnCalculatedField
            this.selectedFunction = {}
            this.selectedCategory = ''
        },
        filterFunctions() {
            const tmp = [...this.calcFieldFunctions].sort((a, b) => {
                return a.name.localeCompare(b.name)
            })
            tmp.forEach((x) => {
                x.category = x.category.toUpperCase()
            })
            this.availableFunctions = tmp
            if (this.selectedCategory && this.selectedCategory !== this.allCategories.name) {
                const cat = this.selectedCategory as any
                this.availableFunctions = tmp.filter((x) => x.category.toUpperCase() === cat.toUpperCase())
            }
        },
        handleCategories() {
            let tmp = [] as any
            this.calcFieldFunctions
                .sort((a, b) => {
                    return a.name.localeCompare(b.name)
                })
                .map((x) => ({ name: x.category, code: x.category.toUpperCase() }))
                .forEach((element) => {
                    if (tmp.filter((y) => y.code === element.code).length == 0) tmp.push({ name: element.name, code: element.code })
                })
            if (tmp.filter((x) => x.name === this.allCategories.name).length == 0) tmp = [this.allCategories, ...tmp]
            this.availableCategories = tmp
        },
        allowDrop(ev) {
            ev.preventDefault()
        },
        dragElement(ev, item, elementType: string) {
            if (this.readOnly) return
            this.dragging = true
            if (elementType === 'function') {
                ev.dataTransfer.setData('myItem', JSON.stringify({ item: item.formula, elementType: elementType }))
            } else if (elementType === 'field') {
                ev.dataTransfer.setData('myItem', JSON.stringify({ item: item, elementType: elementType }))
            }
            ev.dataTransfer.effectAllowed = 'copy'
        },
        drop(cm, ev) {
            this.dragging = false
            if (this.readOnly) return
            ev.stopPropagation()
            ev.preventDefault()
            const data = JSON.parse(ev.dataTransfer.getData('myItem'))
            const selection = editor.getSelection()
            const position = editor.getPosition()
            let fieldAlias = ''
            let text = ''
            if (data.item.fieldAlias) {
                fieldAlias = this.source !== 'QBE' && this.source !== 'dashboard' ? this.wrap(data.item.fieldAlias) : data.item.fieldAlias
            }
            text = data.elementType === 'function' ? data.item : `"${fieldAlias}"`
            const word = editor.getModel().getWordAtPosition(position)
            let range = null
            if (selection.endColumn - selection.startColumn === 0) {
                range = new this.monaco.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn)
                if (word?.word?.match('column_name')) {
                    range = new this.monaco.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn + 11)
                }
            }

            const op = { range: range || selection, text: text, forceMoveMarkers: true }
            editor.executeEdits('my-source', [op])
        },
        wrap(alias: string): string {
            const regex = /(\$F{)[a-zA-Z0-9_]+(})/g
            const found = alias.match(regex)
            return !found ? '$F{' + alias + '}' : alias
        }
    }
})
</script>
<style lang="scss">
.calculatedFieldDialogClass {
    min-width: 600px;
    width: 60%;
    max-width: 1200px;
}

.field-header {
    font-weight: bold;
}
.kn-remove-card-padding .data-condition-list {
    border: 1px solid var(--kn-color-borders);
    border-top: none;
}
.p-listbox-item {
    height: 24px;
    .kn-list-item {
        height: 24px;
    }
}
.card-0-padding .p-card-body,
.card-0-padding .p-card-content {
    padding: 0.25rem;
}
.helpCol {
    height: 100%;
    width: 100%;
    .helpScrollPanel {
        font-size: 0.75em !important;
        height: 140px !important;
    }
}
::v-deep(.p-scrollpanel) {
    p {
        padding: 0.5rem;
        line-height: 1.5;
        margin: 0;
    }
    &.custombar1 {
        .p-scrollpanel-wrapper {
            border-right: 9px solid var(--surface-ground);
        }
        .p-scrollpanel-bar {
            background-color: var(--primary-color);
            opacity: 1;
            transition: background-color 0.2s;
            &:hover {
                background-color: #007ad9;
            }
        }
    }
}
.syntax-error {
    text-decoration: underline;
    text-decoration-style: wavy;
    text-decoration-color: red;
}
.no-syntax-error {
    text-decoration: none;
}
.helpClass {
    font-size: 0.75em;
}
.fieldType,
.formulaType {
    font-size: 0.75em;
    height: 25px !important;
    border-bottom: 1px solid var(--kn-list-border-color);
    cursor: -webkit-grab;
    cursor: grab;
    &.selected {
        background-color: var(--kn-list-item-selected-background-color) !important;
    }
    &:hover {
        background-color: var(--kn-list-item-hover-background-color);
    }
}
.dragging {
    border: 2px dashed #ccc;
}
</style>
