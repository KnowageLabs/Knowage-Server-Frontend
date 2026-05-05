<template>
    <div v-if="exportModel" class="q-px-md q-pb-md">
        <div class="row q-col-gutter-sm">
            <template v-if="widgetType === 'table' && exportModel.pdf">
                <div class="col-12">
                    <q-toggle v-model="exportModel.pdf.enabled" :label="$t('dashboard.widgetEditor.export.exportPdf')" @update:model-value="onEnableExportChanged" />
                </div>
                <div class="col-12 row items-center">
                    <q-radio v-model="selectedExport" val="a4portrait" :label="$t('dashboard.widgetEditor.export.a4portrait')" :disable="pdfExportDisabled" @update:model-value="onSelectedExportChanged" />
                    <q-radio v-model="selectedExport" val="a4landscape" :label="$t('dashboard.widgetEditor.export.a4landscape')" :disable="pdfExportDisabled" @update:model-value="onSelectedExportChanged" />
                    <q-radio v-model="selectedExport" val="custom" :label="$t('common.custom')" :disable="pdfExportDisabled" @update:model-value="onSelectedExportChanged" />
                </div>
                <div class="col-6">
                    <q-input v-model.number="exportModel.pdf.custom.width" type="number" :label="$t('common.width')" outlined dense :disable="pdfExportDisabled || selectedExport !== 'custom'" @blur="exportConfigurationChanged" />
                </div>
                <div class="col-6">
                    <q-input v-model.number="exportModel.pdf.custom.height" type="number" :label="$t('common.height')" outlined dense :disable="pdfExportDisabled || selectedExport !== 'custom'" @blur="exportConfigurationChanged" />
                </div>
                <div class="col-12"><q-separator /></div>
            </template>
            <div v-if="['table', 'html', 'text', 'chartJS', 'highcharts', 'discovery', 'image', 'customchart', 'static-pivot-table'].includes(widgetType)" class="col-12">
                <q-toggle v-model="exportModel.showScreenshot" :label="$t('dashboard.widgetEditor.export.enableScreenshots')" @update:model-value="onEnableExportChanged" />
            </div>
            <div class="col-12">
                <q-toggle v-model="exportModel.showExcelExport" :label="$t('dashboard.widgetEditor.export.showExcelExport')" @update:model-value="onEnableExportChanged" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetExports } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '../../../../../DashboardHelpers'

export default defineComponent({
    name: 'table-widget-export',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            exportModel: null as IWidgetExports | null,
            selectedExport: '',
            widgetType: '' as string
        }
    },
    computed: {
        pdfExportDisabled() {
            return !this.exportModel || (this.exportModel.pdf && !this.exportModel.pdf.enabled)
        }
    },
    created() {
        this.loadExportModel()
    },
    methods: {
        loadExportModel() {
            if (!this.widgetModel) return
            this.widgetType = this.widgetModel.type
            if (this.widgetModel.settings?.configuration) {
                this.exportModel = this.widgetModel.settings.configuration.exports
                this.setSelectedExport()
            }
        },
        setSelectedExport() {
            if (!this.exportModel || this.widgetType !== 'table' || !this.exportModel.pdf) return
            if (this.exportModel.pdf.a4landscape) this.selectedExport = 'a4landscape'
            else if (this.exportModel.pdf.a4portrait) this.selectedExport = 'a4portrait'
            else if (this.exportModel.pdf.custom.enabled) this.selectedExport = 'custom'
        },
        exportConfigurationChanged() {
            emitter.emit('exportModelChanged', this.exportModel)
        },
        onEnableExportChanged() {
            this.exportConfigurationChanged()
        },
        onSelectedExportChanged() {
            if (!this.exportModel || !this.exportModel.pdf) return
            switch (this.selectedExport) {
                case 'a4landscape':
                    this.exportModel.pdf.a4landscape = true
                    this.exportModel.pdf.a4portrait = false
                    this.exportModel.pdf.custom.enabled = false
                    break
                case 'a4portrait':
                    this.exportModel.pdf.a4portrait = true
                    this.exportModel.pdf.a4landscape = false
                    this.exportModel.pdf.custom.enabled = false
                    break
                case 'custom':
                    this.exportModel.pdf.custom.enabled = true
                    this.exportModel.pdf.a4portrait = false
                    this.exportModel.pdf.a4landscape = false
            }
            this.exportConfigurationChanged()
        }
    }
})
</script>
