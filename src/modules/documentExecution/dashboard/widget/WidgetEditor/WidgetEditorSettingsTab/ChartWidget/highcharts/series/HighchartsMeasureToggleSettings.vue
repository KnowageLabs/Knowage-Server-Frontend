<template>
    <div v-if="widgetModel" class="q-px-md q-pb-md">
        <div class="row q-mb-sm">
            <div class="col-12">
                <q-toggle v-model="seriesSettings.showMeasureToggle" :label="$t('dashboard.widgetEditor.highcharts.series.showMeasureToggle')" dense @update:model-value="() => {}" />
                <div class="text-caption text-grey-7 q-mt-xs">
                    {{ $t('dashboard.widgetEditor.highcharts.series.showMeasureToggleHint') }}
                </div>
            </div>
        </div>
        <div v-if="seriesSettings.showMeasureToggle" class="row q-mt-md">
            <div class="col-12">
                <div class="text-subtitle2 q-mb-xs">{{ $t('dashboard.widgetEditor.highcharts.series.availableMeasures') }}</div>
                <div class="text-caption text-grey-7 q-mb-sm">{{ $t('dashboard.widgetEditor.highcharts.series.availableMeasuresHint') }}</div>
                <div v-for="measure in datasetMeasures" :key="measure.name" class="row items-center q-mb-xs">
                    <q-checkbox v-model="selectedMeasures" :val="measure.name" :label="measure.alias || measure.name" dense @update:model-value="onMeasureSelectionChanged" />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { mapActions, mapState } from 'pinia'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'

export default defineComponent({
    name: 'highcharts-measure-toggle-settings',
    components: {},
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
            const widgetMeasures = (this.widgetModel?.columns ?? []).filter((column: any) => (column.fieldType || '').toUpperCase() === 'MEASURE').map((column: any) => ({ name: column.columnName, alias: column.alias || column.columnName, fieldType: 'MEASURE' }))

            if (!this.widgetModel?.dataset) {
                this.datasetMeasures = widgetMeasures
                return
            }

            const allDatasets = this.getAllDatasets()
            const currentDataset = allDatasets.find((ds: any) => ds.id?.dsId === this.widgetModel?.dataset || ds.id === this.widgetModel?.dataset)
            const metadataMeasures = currentDataset?.metadata?.fieldsMeta ? currentDataset.metadata.fieldsMeta.filter((field: any) => (field.fieldType || '').toUpperCase() === 'MEASURE') : []

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
