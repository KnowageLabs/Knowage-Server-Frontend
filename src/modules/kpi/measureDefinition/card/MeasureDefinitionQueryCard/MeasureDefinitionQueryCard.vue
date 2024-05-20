<template>
    <Card>
        <template #content>
            <div class="p-m-3">
                <span class="p-float-label">
                    <Dropdown id="dataSource" v-model="selectedRule.dataSource" class="kn-material-input" :options="datasourcesList" option-label="DATASOURCE_LABEL" @change="loadDataSourceStructure"> </Dropdown>
                    <label for="dataSourceLabel" class="kn-material-input-label">{{ $t('kpi.measureDefinition.dataSource') }}</label>
                </span>
            </div>
            <div v-if="selectedRule.dataSource">
                <Toolbar class="kn-toolbar kn-toolbar--primary p-m-0">
                    <template #end>
                        <q-btn size="sm" flat unelevated :disabled="previewDisabled" @click="showPreview">{{ $t('kpi.measureDefinition.preview') }}</q-btn>
                    </template>
                </Toolbar>
                <knMonaco ref="editor" v-model="code" style="height: 400px" language="sql" @change="onKeyUp" @editor-setup="editorSetup"></knMonaco>
            </div>
        </template>
    </Card>
    <MeasureDefinitionPreviewDialog v-if="preview" :current-rule="selectedRule" :placeholders="placeholders" :columns="columns" :prop-rows="rows" @close="$emit('closePreview')" @loadPreview="$emit('loadPreview')"></MeasureDefinitionPreviewDialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { iRule } from '../../MeasureDefinition'
import { AxiosResponse } from 'axios'
import queryCardDescriptor from './MeasureDefinitionQueryCardDescriptor.json'
import Card from 'primevue/card'
import Dropdown from 'primevue/dropdown'
import MeasureDefinitionPreviewDialog from './MeasureDefinitionPreviewDialog.vue'
import knMonaco from '@/components/UI/KnMonaco/knMonaco.vue'

let editor = null as any
let tempMonacoInstance = null as any

export default defineComponent({
    name: 'measure-definition-query-card',
    components: { Card, Dropdown, knMonaco, MeasureDefinitionPreviewDialog },
    props: { rule: { type: Object, required: true }, datasourcesList: { type: Array, required: true }, aliases: { type: Array }, placeholders: { type: Array }, columns: { type: Array }, rows: { type: Array }, codeInput: { type: String }, preview: { type: Boolean }, activeTab: { type: Number } },
    emits: ['touched', 'queryChanged', 'loadPreview', 'closePreview'],
    data() {
        return {
            queryCardDescriptor,
            selectedRule: {} as iRule,
            code: '',
            monaco: {} as any,
            datasourceStructure: {},
            hintList: [] as any,
            cursorPosition: null
        }
    },
    computed: {
        previewDisabled(): boolean {
            return !this.code
        }
    },
    watch: {
        codeInput(newValue) {
            if (newValue) {
                const selection = editor.getSelection()
                const range = new this.monaco.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn)

                const op = { range: range || selection, text: newValue, forceMoveMarkers: true }
                editor.executeEdits('my-source', [op])
            }
            this.colorizeCode()
            this.$emit('queryChanged')
        }
    },
    async mounted() {
        this.loadRule()
        await this.loadDataSourceStructure()
    },
    methods: {
        loadRule() {
            this.selectedRule = this.rule as iRule
            this.code = this.rule.definition ?? ''
        },
        async loadDataSourceStructure() {
            if (this.selectedRule.dataSource) {
                await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/datasources/structure/${this.selectedRule.dataSource.DATASOURCE_ID}`).then((response: AxiosResponse<any>) => {
                    this.datasourceStructure = response.data
                    this.editorSetup(tempMonacoInstance)
                })
            }
            this.$emit('touched')
        },

        editorSetup(monacoInstance) {
            tempMonacoInstance = monacoInstance
            this.monaco = monacoInstance.monaco
            editor = monacoInstance.editor

            const completers = []
            Object.keys(this.datasourceStructure).forEach((i) => {
                completers.push({
                    label: i,
                    kind: this.monaco.languages.CompletionItemKind.Function,
                    insertText: i
                })
            })

            this.monaco.languages.registerCompletionItemProvider('sql', {
                provideCompletionItems: function (model, position) {
                    const textUntilPosition = model.getValueInRange({
                        startLineNumber: 1,
                        startColumn: 1,
                        endLineNumber: position.lineNumber,
                        endColumn: position.column
                    })
                    const match = textUntilPosition.match(/SELECT()/)
                    if (!match) {
                        return { suggestions: [] }
                    }
                    return {
                        suggestions: completers
                    }
                }
            })
        },
        colorizeCode() {
            if (editor) {
                const matches = editor.getModel().findMatches(/@[a-zA-Z0-9]{1,256}/gim, false, true, false, null, false)
                matches.forEach((match) => {
                    editor.createDecorationsCollection([
                        {
                            range: match.range,
                            options: {
                                isWholeLine: false,
                                inlineClassName: 'monacoPlaceholder'
                            }
                        }
                    ])
                })
                this.selectedRule.definition = this.code
            }
        },
        onKeyUp() {
            this.colorizeCode()
            this.$emit('queryChanged')
        },
        showPreview() {
            this.colorizeCode()
            this.$emit('loadPreview')
        }
    }
})
</script>

<style lang="scss" scoped>
::v-deep(.p-toolbar-group-right) {
    height: 100%;
}

#dataSource {
    width: 100%;
}

.error-dialog {
    width: 60vw;
}
:deep(.monacoPlaceholder) {
    background-color: #f4f4f4;
    color: darkorange;
    font-weight: bold;
}
</style>
