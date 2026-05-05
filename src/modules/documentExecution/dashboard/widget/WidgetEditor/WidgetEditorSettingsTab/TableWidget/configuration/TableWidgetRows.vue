<template>
    <div v-if="rowsModel" class="row q-px-md q-pb-md">
        <div class="col-12 q-mb-sm">
            <q-toggle v-model="rowsModel.indexColumn" :label="$t('dashboard.widgetEditor.rows.enableIndexColumn')" @update:model-value="onIndexColumnChanged" dense />
        </div>
        <div class="col-12"><q-separator /></div>
        <div class="col-12 q-my-sm">
            <q-toggle v-model="rowsModel.rowSpan.enabled" :label="$t('dashboard.widgetEditor.rows.enableRowspan')" @update:model-value="onRowSpanChanged" dense />
        </div>
        <div class="col-12">
            <q-select v-model="rowsModel.rowSpan.column" :options="widgetModel.columns" option-label="alias" option-value="id" emit-value map-options :label="$t('dashboard.widgetEditor.rows.rowSpanColumn')" outlined dense :disable="!rowsModel.rowSpan.enabled" @update:model-value="onRowSpanChanged" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, ITableWidgetRows } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '../../../../../DashboardHelpers'
import descriptor from '../TableWidgetSettingsDescriptor.json'

export default defineComponent({
    name: 'table-widget-rows',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            rowsModel: null as ITableWidgetRows | null
        }
    },
    created() {
        this.setEventListeners()
        this.loadRowsModel()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('columnRemovedFromRows', this.onColumnRemovedFromRows)
        },
        removeEventListeners() {
            emitter.off('columnRemovedFromRows', this.onColumnRemovedFromRows)
        },
        onColumnRemovedFromRows() {
            this.onColumnRemoved()
        },
        loadRowsModel() {
            if (this.widgetModel?.settings?.configuration?.rows) this.rowsModel = this.widgetModel.settings.configuration.rows
        },
        onIndexColumnChanged() {
            emitter.emit('indexColumnChanged', this.rowsModel)
            emitter.emit('refreshTable', this.widgetModel.id)
        },
        onRowSpanChanged() {
            emitter.emit('rowSpanChanged', this.rowsModel)
            emitter.emit('refreshTable', this.widgetModel.id)
        },
        onColumnRemoved() {
            this.loadRowsModel()
            this.onRowSpanChanged()
        }
    }
})
</script>
