<template>
    <div v-if="column" class="row q-col-gutter-xs">
        <q-toolbar class="kn-toolbar kn-toolbar--secondary">
            <q-toolbar-title>
                <q-toggle class="col-12" v-model="column.filter.enabled" dense color="accent" :label="$t('dashboard.widgetEditor.enableFilter')" @update:model-value="selectedColumnUpdated" />
            </q-toolbar-title>
            <Button v-tooltip.left="$t('dashboard.widgetEditor.columnFilterHint')" icon="pi pi-question-circle" class="p-button-text p-button-plain" />
        </q-toolbar>
        <q-select class="col-2" v-model="column.filter.operator" :options="getColumnFilterOptions()" emitValue clearable dense square :label="$t('common.operator')" option-label="label" option-value="value" :disable="!column.filter.enabled" @update:model-value="onFilterOperatorChange">
            <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                    <q-item-section>
                        <q-item-label>{{ $t(scope.opt.label) }}</q-item-label>
                    </q-item-section>
                </q-item>
            </template>
        </q-select>
        <q-input v-if="['=', '<', '>', '<=', '>=', '!=', 'IN', 'like', 'range', 'not IN'].includes(column.filter.operator)" class="col-5" :label="column.filter.operator === 'range' ? $t('common.from') : $t('common.value')" v-model="column.filter.value" dense square :disable="!column.filter.enabled" @update:model-value="onFilterOperatorChange" />
        <q-input v-if="column.filter.operator === 'range'" class="col-5" :label="column.filter.operator === 'range' ? $t('common.from') : $t('common.value')" v-model="column.filter.value2" dense square :disable="!column.filter.enabled" @update:model-value="onFilterOperatorChange" />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidgetColumn } from '@/modules/documentExecution/Dashboard/Dashboard'
import { emitter } from '../../../../DashboardHelpers'
import commonDescriptor from './WidgetCommonDescriptor.json'
import InputSwitch from 'primevue/inputswitch'
import Dropdown from 'primevue/dropdown'

export default defineComponent({
    name: 'widget-editor-filter-form',
    components: { InputSwitch, Dropdown },
    props: { propColumn: { type: Object as PropType<IWidgetColumn | null>, required: true } },
    data() {
        return {
            commonDescriptor,
            column: null as IWidgetColumn | null
        }
    },
    watch: {
        propColumn() {
            this.loadColumn()
        }
    },
    created() {
        this.loadColumn()
    },
    methods: {
        loadColumn() {
            this.column = this.propColumn
        },
        selectedColumnUpdated() {
            console.log('selectedColumnUpdated', this.column)
            emitter.emit('selectedColumnUpdated', this.column)
        },
        getColumnFilterOptions() {
            return this.column?.fieldType === 'ATTRIBUTE' ? this.commonDescriptor.attributeColumnFilterOperators : this.commonDescriptor.measureColumnFilterOperators
        },
        onFilterOperatorChange() {
            if (!this.column || !this.column.filter) return
            if (!['=', '<', '>', '<=', '>=', '!=', 'IN', 'like', 'range'].includes(this.column.filter.operator)) this.column.filter.value = ''
            if (this.column.filter.operator !== 'range') delete this.column.filter.value2
            this.selectedColumnUpdated()
        }
    }
})
</script>
