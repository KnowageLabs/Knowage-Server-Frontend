<template>
    <div v-if="widgetModel" class="p-grid p-jc-center p-ai-center p-p-4">
        <div class="p-col-12 p-md-12">
            <div class="p-field-checkbox p-d-flex p-flex-row p-ai-center">
                <InputSwitch v-model="seriesSettings.showMeasureToggle" />
                <label class="kn-material-input-label p-ml-2">
                    {{ $t('dashboard.widgetEditor.highcharts.series.showMeasureToggle') }}
                </label>
            </div>
            <small class="p-d-block p-mt-2 p-text-secondary">
                {{ $t('dashboard.widgetEditor.highcharts.series.showMeasureToggleHint') }}
            </small>
        </div>

        <div v-if="seriesSettings.showMeasureToggle" class="p-col-12 p-md-12 p-mt-3">
            <label class="kn-material-input-label p-mb-2">
                {{ $t('dashboard.widgetEditor.highcharts.series.availableMeasures') }}
            </label>
            <small class="p-d-block p-mb-2 p-text-secondary">
                {{ $t('dashboard.widgetEditor.highcharts.series.availableMeasuresHint') }}
            </small>
            <div class="p-d-flex p-flex-column">
                <div v-for="measure in datasetMeasures" :key="measure.name" class="p-field-checkbox p-mb-2">
                    <Checkbox
                        :id="measure.name"
                        v-model="selectedMeasures"
                        :value="measure.name"
                        @change="onMeasureSelectionChanged"
                    />
                    <label :for="measure.name" class="p-ml-2">{{ measure.alias || measure.name }}</label>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { mapActions, mapState } from 'pinia'
import InputSwitch from 'primevue/inputswitch'
import Checkbox from 'primevue/checkbox'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'

export default defineComponent({
    name: 'highcharts-measure-toggle-settings',
    components: { InputSwitch, Checkbox },
    props: { propWidgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            widgetModel: null as IWidget | null,
            seriesSettings: null as any,
            datasetMeasures: [] as any[],
            selectedMeasures: [] as string[]
        }
    },
    watch: {
        propWidgetModel: {
            handler() {
                this.loadModel()
                this.loadDatasetMeasures()
            },
            immediate: true
        },
        allDatasets: {
            handler() {
                this.loadDatasetMeasures()
            },
            deep: true
        }
    },
    computed: {
        ...mapState(dashboardStore, ['allDatasets'])
    },
    methods: {
        ...mapActions(dashboardStore, ['getAllDatasets']),
        areStringArraysEqual(firstArray: string[], secondArray: string[]) {
            if (firstArray.length !== secondArray.length) return false
            return firstArray.every((value: string, index: number) => value === secondArray[index])
        },
        loadModel() {
            this.widgetModel = this.propWidgetModel

            // Initialize settings.series if it doesn't exist
            if (!this.widgetModel.settings) {
                this.widgetModel.settings = {}
            }
            if (!this.widgetModel.settings.series) {
                this.widgetModel.settings.series = {}
            }

            this.seriesSettings = this.widgetModel.settings.series

            // Force to false if undefined (InputSwitch interprets undefined as true)
            if (!this.seriesSettings.showMeasureToggle) {
                this.seriesSettings.showMeasureToggle = false
            }

            // Initialize availableMeasures if not present
            if (!this.seriesSettings.availableMeasures) {
                this.seriesSettings.availableMeasures = []
            }
            // Load selected measures
            const availableMeasures = [...this.seriesSettings.availableMeasures]
            if (!this.areStringArraysEqual(this.selectedMeasures, availableMeasures)) this.selectedMeasures = availableMeasures
        },
        loadDatasetMeasures() {
            const widgetMeasures = (this.widgetModel?.columns ?? [])
                .filter((column: any) => (column.fieldType || '').toUpperCase() === 'MEASURE')
                .map((column: any) => ({ name: column.columnName, alias: column.alias || column.columnName, fieldType: 'MEASURE' }))

            if (!this.widgetModel?.dataset) {
                this.datasetMeasures = widgetMeasures
                return
            }

            const allDatasets = this.getAllDatasets()
            const currentDataset = allDatasets.find((ds: any) => ds.id?.dsId === this.widgetModel?.dataset || ds.id === this.widgetModel?.dataset)
            const metadataMeasures = currentDataset?.metadata?.fieldsMeta
                ? currentDataset.metadata.fieldsMeta.filter((field: any) => (field.fieldType || '').toUpperCase() === 'MEASURE')
                : []

            const mergedByName = new Map<string, any>()
            metadataMeasures.forEach((measure: any) => mergedByName.set(measure.name, measure))
            widgetMeasures.forEach((measure: any) => {
                if (!mergedByName.has(measure.name)) mergedByName.set(measure.name, measure)
            })

            this.datasetMeasures = Array.from(mergedByName.values())

            const validMeasureNames = new Set(this.datasetMeasures.map((measure: any) => measure.name))
            this.selectedMeasures = this.selectedMeasures.filter((measureName: string) => validMeasureNames.has(measureName))
            if (this.seriesSettings && !this.areStringArraysEqual(this.seriesSettings.availableMeasures ?? [], this.selectedMeasures)) {
                this.seriesSettings.availableMeasures = [...this.selectedMeasures]
            }
        },
        onMeasureSelectionChanged() {
            if (this.seriesSettings) {
                if (!this.areStringArraysEqual(this.seriesSettings.availableMeasures ?? [], this.selectedMeasures)) {
                    this.seriesSettings.availableMeasures = [...this.selectedMeasures]
                }
            }
        }
    }
})
</script>

<style lang="scss" scoped>
.p-field-checkbox {
    display: flex;
    align-items: center;

    label {
        cursor: pointer;
        user-select: none;
    }
}
</style>

