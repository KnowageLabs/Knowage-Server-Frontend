<template>
    <div class="p-grid p-jc-center p-ai-center p-p-4">
        <div v-if="!categoryThresholdSettings" class="p-col-12">
            <Message severity="warn" :closable="false">
                Impossibile caricare le impostazioni. Verifica che il widget sia configurato correttamente.
            </Message>
        </div>

        <template v-else>
            <Message class="p-col-12 p-mb-3" :closable="false">
                {{ $t('dashboard.widgetEditor.highcharts.categoryThreshold.hint') }}
            </Message>

            <!-- Operator Selection -->
            <div class="p-col-12 p-md-4 p-d-flex p-flex-column kn-flex p-m-2">
                <label class="kn-material-input-label p-mr-2">
                    {{ $t('dashboard.widgetEditor.highcharts.categoryThreshold.operator') }}
                </label>
                <Dropdown
                    v-model="categoryThresholdSettings.operator"
                    class="kn-material-input"
                    :options="['OR', 'AND']"
                    :disabled="categoryThresholdDisabled"
                    @change="modelChanged"
                />
                <small class="p-mt-1">
                    {{ $t('dashboard.widgetEditor.highcharts.categoryThreshold.operatorHint') }}
                </small>
            </div>

            <!-- Add Condition Button -->
            <div class="p-col-12 p-md-8 p-d-flex p-ai-end p-m-2">
                <Button
                    :label="$t('dashboard.widgetEditor.highcharts.categoryThreshold.addCondition')"
                    icon="pi pi-plus"
                    class="p-button-text"
                    :disabled="categoryThresholdDisabled"
                    @click="addCondition"
                />
            </div>

            <!-- Conditions List -->
            <div class="p-col-12">
                <div v-if="!categoryThresholdSettings.conditions || categoryThresholdSettings.conditions.length === 0" class="p-p-3">
                    <Message severity="info" :closable="false">
                        {{ $t('dashboard.widgetEditor.highcharts.categoryThreshold.noConditions') }}
                    </Message>
                </div>

                <div
                    v-for="(condition, index) in categoryThresholdSettings.conditions"
                    :key="index"
                    class="p-grid p-ai-center p-mb-2 condition-row"
                >
                    <div class="p-col-12 p-md-5 p-d-flex p-flex-column">
                        <label class="kn-material-input-label">
                            {{ $t('dashboard.widgetEditor.highcharts.categoryThreshold.category') }}
                        </label>
                        <Dropdown
                            v-model="condition.category"
                            class="kn-material-input"
                            :options="availableCategories"
                            option-value="value"
                            option-label="label"
                            :disabled="categoryThresholdDisabled"
                            @change="modelChanged"
                        />
                    </div>

                    <div class="p-col-12 p-md-3 p-d-flex p-flex-column">
                        <label class="kn-material-input-label">
                            {{ $t('dashboard.widgetEditor.highcharts.categoryThreshold.threshold') }}
                        </label>
                        <InputNumber
                            v-model="condition.threshold"
                            class="kn-material-input"
                            :min="1"
                            :disabled="categoryThresholdDisabled"
                            @blur="modelChanged"
                        />
                    </div>

                    <div class="p-col-12 p-md-4 p-d-flex p-jc-end p-ai-end">
                        <Button
                            icon="pi pi-trash"
                            class="p-button-text p-button-danger"
                            :disabled="categoryThresholdDisabled"
                            @click="removeCondition(index)"
                        />
                    </div>
                </div>
            </div>

            <!-- Message -->
            <div class="p-col-12 p-mt-3">
                <label class="kn-material-input-label">
                    {{ $t('dashboard.widgetEditor.highcharts.categoryThreshold.message') }}
                </label>
                <Textarea
                    v-model="categoryThresholdSettings.message"
                    class="kn-material-input kn-width-full"
                    rows="4"
                    :auto-resize="true"
                    maxlength="500"
                    :disabled="categoryThresholdDisabled"
                    @change="modelChanged"
                />
            </div>

            <!-- Style Toolbar -->
            <div class="p-col-12 p-py-4">
                <WidgetEditorStyleToolbar
                    :options="descriptor.noDataToolbarStyleOptions"
                    :prop-model="toolbarModel"
                    :disabled="categoryThresholdDisabled"
                    @change="onStyleToolbarChange"
                />
            </div>
        </template>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetStyleToolbarModel } from '../../../../../../Dashboard'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import * as highchartsDefaultValues from '../../../../helpers/chartWidget/highcharts/HighchartsDefaultValues'
import descriptor from '../HighchartsWidgetSettingsDescriptor.json'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import Message from 'primevue/message'
import Button from 'primevue/button'
import WidgetEditorStyleToolbar from '../../../common/styleToolbar/WidgetEditorStyleToolbar.vue'

export default defineComponent({
    name: 'highcharts-category-threshold-settings',
    components: { Dropdown, Textarea, InputNumber, Message, Button, WidgetEditorStyleToolbar },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            categoryThresholdSettings: null as any,
            availableCategories: [] as { label: string; value: string }[],
            toolbarModel: {} as {
                'font-family': string
                'font-size': string
                'font-weight': string
                color: string
                'background-color': string
            }
        }
    },
    computed: {
        categoryThresholdDisabled() {
            return !this.categoryThresholdSettings || !this.categoryThresholdSettings.enabled
        }
    },
    watch: {
        widgetModel: {
            handler() {
                this.loadModel()
                this.loadAvailableCategories()
            },
            deep: true
        }
    },
    created() {
        this.loadModel()
        this.loadAvailableCategories()
    },
    methods: {
        loadModel() {
            if (this.widgetModel.settings?.configuration) {
                // Inizializziamo categoryThreshold se non esiste (widget esistenti)
                if (!this.widgetModel.settings.configuration.categoryThreshold) {
                    this.widgetModel.settings.configuration.categoryThreshold =
                        highchartsDefaultValues.getDefaultCategoryThreshold()
                }

                // Migrazione da vecchio formato (singola condizione) a nuovo formato (array)
                const settings = this.widgetModel.settings.configuration.categoryThreshold
                if (settings.category !== undefined && settings.threshold !== undefined) {
                    // Converti il vecchio formato
                    settings.conditions = [{
                        category: settings.category,
                        threshold: settings.threshold
                    }]
                    settings.operator = 'OR'
                    delete settings.category
                    delete settings.threshold
                }

                // Assicurati che conditions sia un array
                if (!Array.isArray(settings.conditions)) {
                    settings.conditions = []
                }

                // Inizializza lo stile se non esiste
                if (!settings.style) {
                    settings.style = {
                        fontFamily: '',
                        fontSize: '14px',
                        fontWeight: '',
                        color: '#666',
                        backgroundColor: ''
                    }
                }

                this.categoryThresholdSettings = settings

                // Carica il toolbarModel dallo stile
                this.toolbarModel = {
                    'font-family': settings.style.fontFamily || '',
                    'font-size': settings.style.fontSize || '14px',
                    'font-weight': settings.style.fontWeight || '',
                    color: settings.style.color || '#666',
                    'background-color': settings.style.backgroundColor || ''
                }
            }
        },
        loadAvailableCategories() {
            this.availableCategories = []
            if (!this.widgetModel.columns) return

            const attributeColumns = this.widgetModel.columns.filter(
                (column) => column.fieldType === 'ATTRIBUTE'
            )

            attributeColumns.forEach((column) => {
                this.availableCategories.push({
                    label: column.alias || column.columnName,
                    value: column.columnName
                })
            })
        },
        addCondition() {
            if (!this.categoryThresholdSettings.conditions) {
                this.categoryThresholdSettings.conditions = []
            }

            this.categoryThresholdSettings.conditions.push({
                category: this.availableCategories.length > 0 ? this.availableCategories[0].value : '',
                threshold: 1
            })

            this.modelChanged()
        },
        removeCondition(index: number) {
            this.categoryThresholdSettings.conditions.splice(index, 1)
            this.modelChanged()
        },
        modelChanged() {
            emitter.emit('refreshChart', this.widgetModel.id)
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel) {
            if (!this.categoryThresholdSettings || !this.categoryThresholdSettings.style) return

            this.toolbarModel = {
                'font-family': model['font-family'] ?? '',
                'font-size': model['font-size'] ?? '14px',
                'font-weight': model['font-weight'] ?? '',
                color: model.color ?? '#666',
                'background-color': model['background-color'] ?? ''
            }

            this.categoryThresholdSettings.style = {
                backgroundColor: this.toolbarModel['background-color'] ?? '',
                color: this.toolbarModel.color ?? '#666',
                fontSize: this.toolbarModel['font-size'] ?? '14px',
                fontFamily: this.toolbarModel['font-family'] ?? '',
                fontWeight: this.toolbarModel['font-weight'] ?? ''
            }

            this.modelChanged()
        }
    }
})
</script>

<style scoped lang="scss">
.condition-row {
    background-color: #f8f9fa;
    border-radius: 4px;
    padding: 8px;
    border-left: 3px solid #007ad9;
}
</style>

