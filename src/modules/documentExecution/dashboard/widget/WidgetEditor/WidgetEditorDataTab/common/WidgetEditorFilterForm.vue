<template>
    tests
    <div v-if="column" class="row q-col-gutter-xs">
        <q-toolbar class="kn-toolbar kn-toolbar--secondary">
            <q-toolbar-title>
                <q-toggle class="col-12" v-model="column.filter.enabled" dense color="accent" :label="$t('dashboard.widgetEditor.enableFilter')" @update:model-value="selectedColumnUpdated" />
            </q-toolbar-title>
            <Button v-tooltip.left="$t('dashboard.widgetEditor.columnFilterHint')" icon="pi pi-question-circle" class="p-button-text p-button-plain" />
        </q-toolbar>
        <q-select class="col-4" v-model="column.filter.operator" :options="getColumnFilterOptions()" emitValue clearable dense square :label="$t('common.operator')" option-label="label" option-value="value" :disable="!column.filter.enabled" @update:model-value="onFilterOperatorChange">
            <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                    <q-item-section>
                        <q-item-label>{{ $t(scope.opt.label) }}</q-item-label>
                    </q-item-section>
                </q-item>
            </template>
        </q-select>
        <q-input v-if="['=', '<', '>', '<=', '>=', '!=', 'like', 'range'].includes(column.filter.operator)" class="col-4 col-grow" :label="column.filter.operator === 'range' ? $t('common.from') : $t('common.value')" v-model="column.filter.value" dense square :disable="!column.filter.enabled" @update:model-value="onFilterOperatorChange" />
        <span v-if="['IN', 'not IN'].includes(column.filter.operator)" class="col-grow p-float-label kn-material-input">
            <Chips v-model="inFilterValues" class="kn-width-full" :add-on-blur="true" :disabled="!column.filter.enabled" @add="onInFilterValuesChange" @remove="onInFilterValuesChange" />
            <label class="kn-material-input-label">{{ $t('common.value') }}</label>
            <small>{{ $t('common.chipsHint') }}</small>
        </span>
        <q-input v-if="column.filter.operator === 'range'" class="col-4" :label="$t('common.to')" v-model="column.filter.value2" dense square :disable="!column.filter.enabled" @update:model-value="onFilterOperatorChange" />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '../../../../DashboardHelpers'
import commonDescriptor from './WidgetCommonDescriptor.json'
import InputSwitch from 'primevue/inputswitch'
import Dropdown from 'primevue/dropdown'
import Chips from 'primevue/chips'

export default defineComponent({
    name: 'widget-editor-filter-form',
    components: { InputSwitch, Dropdown, Chips },
    props: { propColumn: { type: Object as PropType<IWidgetColumn | null>, required: true } },
    data() {
        return {
            commonDescriptor,
            column: null as IWidgetColumn | null
        }
    },
    computed: {
        inFilterValues: {
            get(): string[] {
                if (!this.column?.filter?.value) return []
                return this.column.filter.value
                    .split(',')
                    .map((v) => v.trim())
                    .filter((v) => v.length > 0)
            },
            set(values: string[]) {
                if (this.column?.filter) {
                    this.column.filter.value = values.join(', ')
                }
            }
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
            emitter.emit('selectedColumnUpdated', this.column)
        },
        getColumnFilterOptions() {
            return this.column?.fieldType === 'ATTRIBUTE' ? this.commonDescriptor.attributeColumnFilterOperators : this.commonDescriptor.measureColumnFilterOperators
        },
        onFilterOperatorChange() {
            if (!this.column || !this.column.filter) return
            if (!['=', '<', '>', '<=', '>=', '!=', 'IN', 'like', 'range', 'not IN'].includes(this.column.filter.operator)) this.column.filter.value = ''
            if (this.column.filter.operator !== 'range') delete this.column.filter.value2
            this.selectedColumnUpdated()
        },
        onInFilterValuesChange() {
            this.selectedColumnUpdated()
        }
    }
})
</script>
