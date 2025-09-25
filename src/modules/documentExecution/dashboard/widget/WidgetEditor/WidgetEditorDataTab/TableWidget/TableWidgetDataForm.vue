<template>
    <q-card v-if="widget" flat bordered>
        <q-toolbar class="kn-toolbar kn-toolbar--secondary">
            <q-toolbar-title>{{ $t('dashboard.widgetEditor.toolbars.general') }}</q-toolbar-title>
        </q-toolbar>
        <q-card-section class="p-pb-0">
            <div class="p-fluid p-grid p-formgrid">
                <span class="p-field p-float-label p-col-12 p-lg-6">
                    <Dropdown v-model="sortingColumn" class="kn-material-input" :options="sortingColumnOptions" option-value="id" option-label="alias" show-clear @change="sortingChanged"> </Dropdown>
                    <label class="kn-material-input-label">{{ $t('dashboard.widgetEditor.sortingColumn') }}</label>
                </span>
                <span class="p-field p-float-label p-col-12 p-lg-6">
                    <Dropdown v-model="sortingOrder" class="kn-material-input" :options="commonDescriptor.sortingOrderOptions" option-label="value" option-value="value" show-clear @change="sortingChanged">
                        <template #option="slotProps">
                            <div>
                                <span>{{ $t(slotProps.option.label) }}</span>
                            </div>
                        </template>
                    </Dropdown>
                    <label class="kn-material-input-label">{{ $t('dashboard.widgetEditor.sortingOrder') }}</label>
                </span>
            </div>
            <form v-if="widget.type === 'table'" class="p-fluid p-formgrid p-grid p-mb-4">
                <div class="p-col-6 p-lg-4">
                    <span class="p-float-label">
                        <InputText v-model="itemsNumber" class="kn-material-input p-inputtext-sm" type="number" :disabled="!paginationEnabled" @change="paginationChanged" />
                        <label class="kn-material-input-label">{{ $t('dashboard.widgetEditor.itemsPerPage') }}</label>
                    </span>
                </div>
                <span class="p-col-6 p-lg-6 p-d-flex p-ai-center">
                    <InputSwitch v-model="paginationEnabled" @change="paginationChanged"></InputSwitch>
                    <label for="visible" class="kn-material-input-label p-ml-2"> {{ $t('common.enable') }} {{ $t('dashboard.widgetEditor.pagination') }}</label>
                </span>
            </form>
        </q-card-section>
    </q-card>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '../../../../DashboardHelpers'
import Dropdown from 'primevue/dropdown'
import descriptor from '../TableWidget/TableWidgetDataDescriptor.json'
import commonDescriptor from '../common/WidgetCommonDescriptor.json'
import InputSwitch from 'primevue/inputswitch'

export default defineComponent({
    name: 'table-widget-data-form',
    components: { Dropdown, InputSwitch },
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
            if (column.columnName === this.sortingColumn) {
                this.sortingColumn = ''
                this.sortingOrder = ''
                this.paginationChanged()
            }
        }
    }
})
</script>

<style lang="scss"></style>
