<template>
    <div v-if="column" class="filter-form">
        <div class="filter-form__band row items-center no-wrap">
            <q-toggle v-model="column.filter.enabled" dense :label="$t('dashboard.widgetEditor.enableFilter')" @update:model-value="selectedColumnUpdated" />
            <q-space />
            <q-icon name="help_outline" size="18px" class="kn-editor-card-hint">
                <q-tooltip anchor="center left" self="center right" max-width="300px">{{ $t('dashboard.widgetEditor.columnFilterHint') }}</q-tooltip>
            </q-icon>
        </div>
        <div class="row q-col-gutter-sm">
            <q-select class="col-4" v-model="column.filter.operator" :options="getColumnFilterOptions()" emit-value clearable outlined dense hide-bottom-space options-dense :label="$t('common.operator')" option-label="label" option-value="value" :disable="!column.filter.enabled" @update:model-value="onFilterOperatorChange">
                <template #option="scope">
                    <q-item v-bind="scope.itemProps">
                        <q-item-section>
                            <q-item-label>{{ $t(scope.opt.label) }}</q-item-label>
                        </q-item-section>
                    </q-item>
                </template>
            </q-select>
            <q-input v-if="['=', '<', '>', '<=', '>=', '!=', 'like', 'range'].includes(column.filter.operator)" class="col-4 col-grow" :label="column.filter.operator === 'range' ? $t('common.from') : $t('common.value')" v-model="column.filter.value" outlined dense hide-bottom-space :disable="!column.filter.enabled" @update:model-value="onFilterValueChange" />
            <q-select
                v-if="['IN', 'not IN'].includes(column.filter.operator)"
                ref="inFilterSelect"
                class="col-grow"
                :model-value="inFilterValues"
                :label="$t('common.value')"
                :hint="$t('common.chipsHint')"
                :disable="!column.filter.enabled"
                multiple
                use-chips
                use-input
                new-value-mode="add"
                input-debounce="0"
                hide-dropdown-icon
                outlined
                dense
                @update:model-value="onInFilterValuesUpdate"
                @input-value="inFilterInput = $event"
                @blur="addPendingInFilterValue"
            />
            <q-input v-if="column.filter.operator === 'range'" class="col-4" :label="$t('common.to')" v-model="column.filter.value2" outlined dense hide-bottom-space :disable="!column.filter.enabled" @update:model-value="onFilterValueChange" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '../../../../DashboardHelpers'
import commonDescriptor from './WidgetCommonDescriptor.json'

export default defineComponent({
    name: 'widget-editor-filter-form',
    props: { propColumn: { type: Object as PropType<IWidgetColumn | null>, required: true } },
    data() {
        return {
            commonDescriptor,
            column: null as IWidgetColumn | null,
            filterValueTimer: undefined as ReturnType<typeof setTimeout> | undefined,
            inFilterInput: ''
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
        onFilterValueChange() {
            clearTimeout(this.filterValueTimer)
            this.filterValueTimer = setTimeout(() => this.onFilterOperatorChange(), 500)
        },
        onInFilterValuesChange() {
            this.selectedColumnUpdated()
        },
        onInFilterValuesUpdate(values: string[] | null) {
            this.inFilterValues = values ?? []
            this.onInFilterValuesChange()
        },
        // PrimeVue Chips added the typed text on blur (add-on-blur); q-select adds it only on Enter
        addPendingInFilterValue() {
            const value = this.inFilterInput.trim()
            if (!value) return
            this.inFilterValues = [...this.inFilterValues, value]
            this.inFilterInput = ''
            ;(this.$refs.inFilterSelect as any)?.updateInputValue('', true)
            this.onInFilterValuesChange()
        }
    }
})
</script>

<style lang="scss" scoped>
// Header band of the filter section: it separates the filter from the column settings above it
// (the panel around the form has 12px padding, the band spans the full width)
.filter-form__band {
    min-height: 36px;
    margin: 12px -12px 10px;
    padding: 0 12px;
    background-color: var(--kn-editor-filter-band-background);
}
</style>
