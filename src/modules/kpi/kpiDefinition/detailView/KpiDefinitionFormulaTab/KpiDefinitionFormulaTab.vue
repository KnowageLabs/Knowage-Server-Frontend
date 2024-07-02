<template>
    <form class="p-fluid p-formgrid p-grid p-mt-3">
        <div class="p-field p-col-6">
            <span class="p-float-label p-mb-2">
                <InputText
                    id="name"
                    v-model.trim="v$.selectedKpi.name.$model"
                    class="kn-material-input"
                    type="text"
                    max-length="25"
                    :class="{
                        'p-invalid': v$.selectedKpi.name.$invalid && v$.selectedKpi.name.$dirty
                    }"
                    @blur="v$.selectedKpi.name.$touch()"
                />
                <label for="label" class="kn-material-input-label">{{ $t('common.name') }} * </label>
            </span>
            <KnValidationMessages
                :v-comp="v$.selectedKpi.name"
                :additional-translate-params="{
                    fieldName: $t('common.name')
                }"
            >
            </KnValidationMessages>
        </div>
        <div class="p-field p-col-6">
            <span class="p-float-label p-mb-2">
                <InputText id="name" v-model.trim="selectedKpi.author" class="kn-material-input" type="text" :disabled="true" />
                <label for="name" class="kn-material-input-label"> {{ $t('common.author') }}</label>
            </span>
        </div>
    </form>
    <knMonaco ref="editor" v-if="!loading && selectedKpi.definition" language="kpiLang" v-model="selectedKpi.definition.formulaDecoded" style="height: 200px" @change="onKeyUp" @editor-setup="editorSetup" @click="onMouseClick"></knMonaco>
    <Dialog class="kn-dialog--toolbar--primary importExportDialog" footer="footer" :visible="functionDialogVisible" :closable="false" modal>
        <template #header>
            <h4>{{ $t('kpi.kpiDefinition.formulaDialogHeader') }} {{ dialogHeaderInfo.functionName }}</h4>
        </template>

        <div class="p-mt-4 p-ml-4">
            <div class="p-field-radiobutton">
                <RadioButton id="SUM" v-model="selectedFunctionalities" name="city" value="SUM" />
                <label for="SUM">SUM</label>
            </div>
            <div class="p-field-radiobutton">
                <RadioButton id="MAX" v-model="selectedFunctionalities" name="city" value="MAX" />
                <label for="MAX">MAX</label>
            </div>
            <div class="p-field-radiobutton">
                <RadioButton id="MIN" v-model="selectedFunctionalities" name="city" value="MIN" />
                <label for="MIN">MIN</label>
            </div>
            <div class="p-field-radiobutton">
                <RadioButton id="COUNT" v-model="selectedFunctionalities" name="city" value="COUNT" />
                <label for="COUNT">COUNT</label>
            </div>
        </div>
        <template #footer>
            <div>
                <Button class="kn-button kn-button--secondary" :label="$t('common.cancel')" @click="cancel" />
                <Button class="kn-button" :label="$t('common.apply')" @click="openFunctionPicker" />
            </div>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { createValidations } from '@/helpers/commons/validationHelper'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'
import useValidate from '@vuelidate/core'
import tabViewDescriptor from '../KpiDefinitionDetailDescriptor.json'
import Dialog from 'primevue/dialog'
import RadioButton from 'primevue/radiobutton'
import mainStore from '../../../../../App.store'
import knMonaco from '@/components/UI/KnMonaco/knMonaco.vue'

let editor = null

export default defineComponent({
    components: { knMonaco, Dialog, RadioButton, KnValidationMessages },
    props: { propKpi: Object as any, measures: { type: Array as any }, aliasToInput: { type: String }, checkFormula: { type: Boolean }, activeTab: { type: Number }, loading: Boolean, reloadKpi: Boolean },
    emits: ['touched', 'errorInFormula', 'updateFormulaToSave', 'onGuideClose'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            v$: useValidate() as any,
            tabViewDescriptor,
            selectedKpi: {} as any,
            monaco: {} as any,
            previousTabIndex: 0 as any,
            dialogHeaderInfo: {} as any,
            measuresToJSON: [] as any,
            functionsTOJSON: [] as any,
            formula: '',
            formulaDecoded: '',
            formulaSimple: '',
            token: '' as any,
            selectedFunctionalities: 'SUM',
            functionDialogVisible: false,
            cursorPosition: null
        }
    },
    validations() {
        return {
            selectedKpi: createValidations('selectedKpi', tabViewDescriptor.validations.selectedKpi)
        }
    },
    watch: {
        propKpi() {
            this.selectedKpi = this.propKpi as any
            if (this.selectedKpi.definition != '') {
                this.selectedKpi.definition = JSON.parse(this.selectedKpi.definition)
            }
        },

        activeTab() {
            if (this.previousTabIndex === 0 && this.activeTab != 0) {
                if (this.selectedKpi?.definition?.measures.length === 0) {
                    this.store.setError({ msg: this.$t('kpi.kpiDefinition.errorformula.missingmeasure') })
                    this.$emit('errorInFormula', true)
                }
            }
            this.previousTabIndex = this.activeTab
        },
        'selectedKpi.definition.formulaDecoded'(newValue) {
            let counter = -1
            this.selectedKpi.definition.formula = newValue.replace(/(SUM|MIN|COUNT|MAX){1}\([a-zA-Z0-9]{0,256}\)/gm, (match) => {
                counter++
                return 'M' + counter
            })
            this.selectedKpi.definition.formulaSimple = newValue.replace(/SUM|MIN|COUNT|MAX|\(|\)/gm, '')
            this.selectedKpi.definition.functions = newValue.match(/SUM|MIN|COUNT|MAX/gm)
            this.selectedKpi.definition.measures = Array.from(newValue.matchAll(/(?<=SUM|MIN|COUNT|MAX{1})\(([a-zA-Z0-9]{0,256})\)/gm), (m) => m[1])
            this.$emit('updateFormulaToSave', this.selectedKpi.definition.formula)
        }
    },

    mounted() {
        if (this.propKpi) {
            this.selectedKpi = this.propKpi as any
        }
    },

    methods: {
        cancel() {
            this.functionDialogVisible = false
        },
        editorSetup(monacoInstance) {
            this.monaco = monacoInstance.monaco
            editor = monacoInstance.editor
        },
        openFunctionPicker() {
            const range = new this.monaco.Range(this.token.startLineNumber, this.token.startColumn, this.token.endLineNumber, this.token.endColumn)
            const op = { range: range, text: `${this.selectedFunctionalities}(${this.token.word})`, forceMoveMarkers: true }
            editor.executeEdits('my-source', [op])
            this.functionDialogVisible = false
        },
        onKeyUp(event) {
            this.$emit('touched')
        },
        onMouseClick(event) {
            const position = editor.getPosition()
            const word = editor.getModel().getWordAtPosition(position)
            if (word?.word.length > 1) {
                this.token = word
                this.dialogHeaderInfo.functionName = word.word
                this.functionDialogVisible = true
            }
        },

        reset() {
            this.measuresToJSON = []
            this.functionsTOJSON = []
            this.formula = ''
            this.formulaDecoded = ''
            this.formulaSimple = ''
        },
        measureInList(item, list) {
            for (let i = 0; i < list.length; i++) {
                const object = list[i]
                if (object.alias == item) {
                    return i
                }
            }

            return -1
        }
    }
})
</script>
