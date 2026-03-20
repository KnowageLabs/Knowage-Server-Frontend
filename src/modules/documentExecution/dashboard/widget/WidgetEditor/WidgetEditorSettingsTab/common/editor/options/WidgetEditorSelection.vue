<template>
    <div v-if="!widgetModel.dataset" class="q-mb-sm q-pa-sm row items-center text-warning">
        <q-icon name="warning" class="q-mr-sm" />
        {{ $t('managers.functionsCatalog.noDatasetSelected') }}
    </div>
    <div v-else class="p-fluid p-formgrid p-grid q-pb-lg q-mx-sm">
            <q-select
                v-model="selectedColumnName"
                class="p-col-4"
                dense
                emit-value
                map-options
                :options="widgetModel.columns"
                option-value="columnName"
                option-label="columnName"
                :label="$t('common.column')"
                @update:model-value="onColumnChanged"
            />
            <q-toggle v-model="multipleValues" color="black" :label="$t('dashboard.widgetEditor.editorTags.multipleValues')" @update:model-value="onModeChanged" />
            <q-input v-if="!multipleValues" class="p-col" v-model="selectionValue" dense :label="$t('dashboard.widgetEditor.editorTags.selectionVal')" @update:model-value="onColumnChanged" />
            <q-select
                v-else
                class="p-col"
                v-model="selectionValues"
                dense
                multiple
                use-chips
                use-input
                new-value-mode="add-unique"
                input-debounce="0"
                :options="[]"
                :label="$t('dashboard.widgetEditor.editorTags.selectionValues')"
                :hint="$t('dashboard.widgetEditor.editorTags.selectionValuesHint')"
                @update:model-value="onColumnChanged"
            />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import descriptor from '../WidgetTagsDialogDescriptor.json'

export default defineComponent({
    name: 'widget-editor-selections',
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    emits: ['insertChanged'],
    data() {
        return {
            descriptor,
            selectedColumnName: '',
            selectionValue: '',
            selectionValues: [] as string[],
            multipleValues: false
        }
    },
    watch: {
        selectionValues(newVals: string[]) {
            const trimmed = newVals.map((v) => v.trim()).filter((v) => v.length > 0)
            if (JSON.stringify(trimmed) !== JSON.stringify(newVals)) {
                this.selectionValues = trimmed
            }
        }
    },
    methods: {
        onModeChanged() {
            this.selectionValue = ''
            this.selectionValues = []
            this.onColumnChanged()
        },
        onColumnChanged() {
            const valueStr = this.multipleValues ? '[' + this.selectionValues.map((v) => `'${v}'`).join(', ') + ']' : this.selectionValue
            const forInsert =
                this.widgetModel.type === 'html'
                    ? `<div kn-selection-column="${this.selectedColumnName}" kn-selection-value="${valueStr}"></div>`
                    : `<span class="selection" kn-selection-column="${this.selectedColumnName}" kn-selection-value="${valueStr}">[kn-column='${this.selectedColumnName}']</span>`
            this.$emit('insertChanged', forInsert)
        }
    }
})
</script>
