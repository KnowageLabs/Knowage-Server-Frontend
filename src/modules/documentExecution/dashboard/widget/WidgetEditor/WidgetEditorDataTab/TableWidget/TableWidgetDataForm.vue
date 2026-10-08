<template>
    <q-card v-if="widget" flat bordered>
        <q-card-section class="q-py-sm">
            <div class="kn-editor-card-label">{{ $t('dashboard.widgetEditor.toolbars.general') }}</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
            <div class="row q-col-gutter-sm">
                <q-select class="col-6" v-model="sortingColumn" :options="sortingColumnOptions" option-value="id" option-label="alias" emit-value map-options clearable outlined dense hide-bottom-space options-dense :label="$t('dashboard.widgetEditor.sortingColumn')" @update:model-value="sortingChanged" />
                <q-select class="col-6" v-model="sortingOrder" :options="commonDescriptor.sortingOrderOptions" option-value="value" :option-label="(option) => (option?.label ? $t(option.label) : option ?? '')" emit-value map-options clearable outlined dense hide-bottom-space options-dense :label="$t('dashboard.widgetEditor.sortingOrder')" @update:model-value="sortingChanged" />
            </div>
            <div v-if="widget.type === 'table'" class="row items-center q-col-gutter-sm q-mt-xs">
                <q-input class="col-6 col-lg-4" v-model="itemsNumber" type="number" outlined dense hide-bottom-space :label="$t('dashboard.widgetEditor.itemsPerPage')" :disable="!paginationEnabled" @change="paginationChanged" />
                <div class="col-6 col-lg-6">
                    <q-toggle v-model="paginationEnabled" dense :label="$t('common.enable') + ' ' + $t('dashboard.widgetEditor.pagination')" @update:model-value="paginationChanged" />
                </div>
            </div>
        </q-card-section>
    </q-card>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '../../../../DashboardHelpers'
import descriptor from '../TableWidget/TableWidgetDataDescriptor.json'
import commonDescriptor from '../common/WidgetCommonDescriptor.json'

export default defineComponent({
    name: 'table-widget-data-form',
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, sortingColumnOptions: { type: Array as PropType<IWidgetColumn[]>, required: true } },
    data() {
        return {
            descriptor,
            commonDescriptor,
            widget: {} as IWidget,
            paginationEnabled: false,
            itemsNumber: '0',
            sortingColumn: '',
            sortingOrder: ''
        }
    },
    created() {
        this.loadWidget()
        this.setEventListeners()
        this.loadPagination()
        this.loadSortingSettings()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        loadWidget() {
            this.widget = this.widgetModel
        },
        setEventListeners() {
            emitter.on('columnRemoved', this.onColumnRemoved)
        },
        removeEventListeners() {
            emitter.off('columnRemoved', this.onColumnRemoved)
        },
        onColumnRemoved(column: any) {
            this.updateSortingColumn(column)
        },
        loadPagination() {
            if (this.widget?.settings?.pagination) {
                this.paginationEnabled = this.widget.settings.pagination.enabled
                this.itemsNumber = '' + this.widget.settings.pagination.properties.itemsNumber
            }
        },
        loadSortingSettings() {
            if (this.widget?.settings?.sortingColumn) this.sortingColumn = this.widget.settings.sortingColumn
            if (this.widget?.settings?.sortingOrder) this.sortingOrder = this.widget.settings.sortingOrder
        },
        paginationChanged() {
            if (!this.widget.settings) return
            this.widget.settings.pagination.enabled = this.paginationEnabled
            this.widget.settings.pagination.properties.itemsNumber = +this.itemsNumber
            emitter.emit('paginationChanged', this.widget.settings.pagination)
            emitter.emit('refreshWidgetWithData', this.widget.id)
        },
        sortingChanged() {
            if (!this.widget.settings) return
            this.widget.settings.sortingColumn = this.sortingColumn
            this.widget.settings.sortingOrder = this.sortingOrder
            emitter.emit('sortingChanged', { sortingColumn: this.widget.settings.sortingColumn, sortingOrder: this.widget.settings.sortingOrder })
            emitter.emit('refreshWidgetWithData', this.widget.id)
        },
        updateSortingColumn(column: IWidgetColumn) {
            if (column.id === this.sortingColumn) {
                this.sortingColumn = ''
                this.sortingOrder = ''
                this.sortingChanged()
            }
        }
    }
})
</script>

<style lang="scss"></style>
