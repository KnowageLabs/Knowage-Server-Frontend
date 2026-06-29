<template>
    <div v-if="!widgetModel.dataset" class="row items-center text-warning q-mb-sm">
        <q-icon name="warning" class="q-mr-sm" />
        {{ $t('managers.functionsCatalog.noDatasetSelected') }}
    </div>
    <div v-else class="row q-col-gutter-sm">
        <div class="col-4">
            <q-select v-model="selectedColumn" outlined dense :options="widgetModel.columns" option-label="columnName" :label="$t('common.column')" @update:model-value="onColumnChanged" />
        </div>
        <div class="col-4">
            <q-input v-model="row" outlined dense :label="$t('common.row')" @update:model-value="onColumnChanged" />
        </div>
        <div class="col-4">
            <q-select v-model="aggregation" outlined dense :options="translatedAggregations" option-value="value" option-label="label" emit-value map-options :label="$t('dashboard.widgetEditor.aggregation')" @update:model-value="onColumnChanged" />
        </div>
        <div v-if="selectedColumn && selectedColumn.fieldType === 'MEASURE'" class="col-4">
            <q-input v-model="precision" outlined dense type="number" :label="$t('dashboard.widgetEditor.precision')" @update:model-value="onColumnChanged" />
        </div>
        <div class="col-4">
            <q-input v-model="prefix" outlined dense :label="$t('dashboard.widgetEditor.prefix')" @update:model-value="onColumnChanged" />
        </div>
        <div class="col-4">
            <q-input v-model="suffix" outlined dense :label="$t('dashboard.widgetEditor.suffix')" @update:model-value="onColumnChanged" />
        </div>
        <div class="col-4 row items-center q-mt-xs">
            <q-toggle v-model="format" :label="$t('dashboard.widgetEditor.editorTags.toLocale')" @update:model-value="onColumnChanged" />
            <q-icon name="help_outline" class="q-ml-auto cursor-pointer text-grey-6">
                <q-tooltip>{{ $t('dashboard.widgetEditor.editorTags.hint.toLocale') }}</q-tooltip>
            </q-icon>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import tableDescriptor from '../../../TableWidget/TableWidgetSettingsDescriptor.json'

export default defineComponent({
    name: 'widget-editor-column-data',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    emits: ['insertChanged'],
    data() {
        return {
            tableDescriptor,
            selectedColumn: null as IWidgetColumn | null,
            row: '',
            aggregation: '',
            prefix: '',
            suffix: '',
            precision: 0 as any,
            format: false
        }
    },
    computed: {
        translatedAggregations(): { label: string; value: string }[] {
            return tableDescriptor.aggregationOptions.map((opt) => ({ label: opt.label ? this.$t(opt.label) : '', value: opt.value }))
        }
    },
    methods: {
        onColumnChanged() {
            if (this.selectedColumn && this.selectedColumn.fieldType === 'ATTRIBUTE') this.precision = 0
            const forInsert = this.widgetModel.type === 'html' ? this.htmlStringBuilder() : this.widgetStringBuilder()
            this.$emit('insertChanged', forInsert)
        },
        htmlStringBuilder() {
            return `[kn-column='${this.selectedColumn?.columnName}'${this.row ? ` row='${this.row}'` : ''}${this.aggregation ? ` aggregation='${this.aggregation}'` : ''}${this.selectedColumn?.fieldType === 'MEASURE' ? ` precision='${this.precision}'` : ''}${this.format ? ' format' : ''}${this.prefix ? ` prefix='${this.prefix}'` : ''}${this.suffix ? ` suffix='${this.suffix}'` : ''}]`
        },
        widgetStringBuilder() {
            return `${this.prefix ?? ''}[kn-column='${this.selectedColumn?.columnName}'${this.row ? ` row='${this.row}'` : ''}${this.aggregation ? ` aggregation='${this.aggregation}'` : ''}${this.precision ? ` precision='${this.precision}'` : ''}${this.format ? ' format' : ''}]${this.suffix ?? ''}`
        }
    }
})
</script>
