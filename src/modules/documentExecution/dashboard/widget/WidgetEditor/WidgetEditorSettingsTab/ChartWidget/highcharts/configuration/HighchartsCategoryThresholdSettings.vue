<template>
    <div class="q-px-md q-pb-sm">
        <div v-if="!categoryThresholdSettings" class="row q-mb-sm">
            <q-banner class="col-12 bg-negative text-white" rounded dense>Impossibile caricare le impostazioni. Verifica che il widget sia configurato correttamente.</q-banner>
        </div>

        <template v-else>
            <!-- Message to display + style toolbar (always on top) -->
            <div class="row q-mb-sm">
                <div class="col-12">
                    <q-input v-model="categoryThresholdSettings.message" :label="$t('dashboard.widgetEditor.highcharts.categoryThreshold.message')" type="textarea" outlined dense autogrow maxlength="500" :disable="categoryThresholdDisabled" @change="modelChanged" />
                </div>
            </div>
            <div class="row q-mb-sm">
                <div class="col-12">
                    <WidgetEditorStyleToolbar :options="descriptor.noDataToolbarStyleOptions" :prop-model="toolbarModel" :disabled="categoryThresholdDisabled" @change="onStyleToolbarChange" />
                </div>
            </div>

            <q-separator class="q-mb-sm" />

            <!-- Operator + add button -->
            <div class="row q-col-gutter-sm q-mb-xs items-center">
                <div class="col-12">
                    <q-select v-model="categoryThresholdSettings.operator" :label="$t('dashboard.widgetEditor.highcharts.categoryThreshold.operator')" outlined dense :options="['OR', 'AND']" :hint="$t('dashboard.widgetEditor.highcharts.categoryThreshold.hint')" :disable="categoryThresholdDisabled" @update:model-value="modelChanged" />
                </div>
                <div class="col-12 row items-center justify-between">
                    <span class="text-subtitle2">{{ $t('dashboard.widgetEditor.highcharts.categoryThreshold.conditions') }}</span>
                    <q-btn flat round dense color="primary" icon="add" :disable="categoryThresholdDisabled" @click="addCondition" />
                </div>
            </div>

            <!-- Conditions list -->
            <div v-if="!categoryThresholdSettings.conditions || categoryThresholdSettings.conditions.length === 0" class="row q-mb-sm">
                <q-banner class="col-12 bg-info text-white" rounded dense>{{ $t('dashboard.widgetEditor.highcharts.categoryThreshold.noConditions') }}</q-banner>
            </div>

            <div v-for="(condition, index) in categoryThresholdSettings.conditions" :key="index" class="column-type-row row no-wrap q-mb-sm">
                <div class="kn-action-handle kn-action-handle-disabled"></div>
                <div class="col q-pa-sm">
                    <div class="row q-col-gutter-sm">
                        <div class="col-7">
                            <q-select v-model="condition.category" :label="$t('dashboard.widgetEditor.highcharts.categoryThreshold.category')" emit-value map-options outlined dense :options="availableCategories" option-value="value" option-label="label" :disable="categoryThresholdDisabled" @update:model-value="modelChanged" />
                        </div>
                        <div class="col-5">
                            <q-input v-model.number="condition.threshold" type="number" :label="$t('dashboard.widgetEditor.highcharts.categoryThreshold.threshold')" outlined dense :min="1" :disable="categoryThresholdDisabled" @blur="modelChanged" />
                        </div>
                    </div>
                </div>
                <div class="kn-action-handle row items-center justify-center" :class="categoryThresholdDisabled ? 'kn-action-handle-disabled' : ''">
                    <q-btn flat round dense icon="delete" size="sm" :disable="categoryThresholdDisabled" @click.stop="removeCondition(Number(index))" />
                </div>
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
import WidgetEditorStyleToolbar from '../../../common/styleToolbar/WidgetEditorStyleToolbar.vue'

export default defineComponent({
    name: 'highcharts-category-threshold-settings',
    components: { WidgetEditorStyleToolbar },
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
                    this.widgetModel.settings.configuration.categoryThreshold = highchartsDefaultValues.getDefaultCategoryThreshold()
                }

                // Migrazione da vecchio formato (singola condizione) a nuovo formato (array)
                const settings = this.widgetModel.settings.configuration.categoryThreshold
                if (settings.category !== undefined && settings.threshold !== undefined) {
                    // Converti il vecchio formato
                    settings.conditions = [
                        {
                            category: settings.category,
                            threshold: settings.threshold
                        }
                    ]
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

            const attributeColumns = this.widgetModel.columns.filter((column) => column.fieldType === 'ATTRIBUTE')

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
.column-type-row {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}
</style>
